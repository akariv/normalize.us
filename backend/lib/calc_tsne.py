import os
import math
import json
import numpy as np
import requests
from PIL import Image
from lapjv import lapjv
from sklearn.manifold import TSNE
from scipy.spatial.distance import cdist
# from keras.applications.vgg16 import preprocess_input
from tensorflow.python.keras.preprocessing import image
from io import BytesIO
from sqlalchemy import create_engine
import concurrent.futures
from queue import Queue

from .net import upload_fileobj_s3

if 'DATABASE_URL' in os.environ:
    engine = create_engine(os.environ['DATABASE_URL'])
class ImageLoader():
    def __init__(self, images, args):
        self.concurrency = 32
        self.queue = Queue()
        self.images = images
        self.args = args
        assert len(set(self.images)) == len(images), 'Duplicate image id'

        self.image_fetches = 0
        self.queue_recv = 0
        self.cache = dict()

    def start(self):
        print('Fetching %d images' % len(self.images))
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=self.concurrency)
        for image in self.images:
            self.executor.submit(self.load_image, image, *self.args, self.queue)
        print('Done submitting')

    def fini(self):
        print('Finalizing executor')
        del self.executor
        print('Finalizing executor done')

    def load_image(self, id, out_res_x, out_res_y, img_location, img_size, queue):
        # print('Fetching %s' % id)
        img_url = f'https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/photos/{id}_full.png'
        for retry in range(10):
            try:
                resp = requests.get(img_url, timeout=5)
                if resp.status_code != 200:
                    print('FAILED', retry, 'to fetch', img_url, 'status code', resp.status_code)
                break
            except Exception as e:
                print('FAILED', retry, 'to fetch', img_url, 'exp', str(e))

        img_data = resp.content
        img = Image.open(BytesIO(img_data))
        img = img.crop((*img_location, img_location[0] + img_size[0], img_location[1] + img_size[1]))
        img = img.convert('RGB')
        img = img.resize((out_res_x, out_res_y), Image.NEAREST)
        # img = ImageOps.autocontrast(img)
        self.queue.put((id, img))

    def get_image(self, need_id):
        assert need_id in self.images, 'Image %s not in set' % need_id
        while need_id not in self.cache:
            id, img = self.queue.get()
            # print('got', id)
            self.cache[id] = img
            self.queue_recv += 1
            # if self.queue_recv % 100 == 0:
            #     print('...', self.queue_recv, len(self.cache))

        self.image_fetches += 1
        if self.image_fetches % 100 == 0:
            print('...', self.image_fetches, self.queue_recv, len(self.cache))
        return self.cache.pop(need_id)


def load_activations():
    print('Fetching descriptors')
    with engine.connect() as conn:
        rows = conn.execution_options(stream_results=True).execute('''
            select id, image, tournaments, votes, descriptor, landmarks, gender_age, place_name, created_timestamp,
                votes_0, tournaments_0, 
                votes_1, tournaments_1, 
                votes_2, tournaments_2, 
                votes_3, tournaments_3, 
                votes_4, tournaments_4
            from faces
            where allowed>0
            order by id desc limit 500''')
        ids = []
        activations = []
        for row in rows:
            id, image, tournaments, votes, descriptor, landmarks, gender_age, place_name, created_timestamp, *per_feature = row
            ids.append(dict(
                id=id, image=image,
                tournaments=tournaments,votes=votes,
                votes_0=per_feature[0],tournaments_0=per_feature[1],
                votes_1=per_feature[2],tournaments_1=per_feature[3],
                votes_2=per_feature[4],tournaments_2=per_feature[5],
                votes_3=per_feature[6],tournaments_3=per_feature[7],
                votes_4=per_feature[8],tournaments_4=per_feature[9],
                landmarks=landmarks, descriptor=descriptor,
                gender_age=gender_age, place_name=place_name,
                created_timestamp=created_timestamp.isoformat()
            ))
            activations.append(descriptor)
            # if len(img_collection) > 100:
            #     break
        return ids, activations

# def get_activations(model, img_collection, to_plot):
#     activations = []
#     for idx, img in enumerate(img_collection):
#         if idx == to_plot:
#             break;
#         print("Processing image {}".format(idx+1))
#         img = img.resize((224, 224), Image.ANTIALIAS)
#         x = image.img_to_array(img)
#         x = np.expand_dims(x, axis=0)
#         x = preprocess_input(x)
#         activations.append(np.squeeze(model.predict(x)))
#         print(activations[-1])
#         import sys
#         sys.exit(0)
#     return activations

def generate_tsne(activations, to_plot, perplexity=50, tsne_iter=5000):
    tsne = TSNE(perplexity=perplexity, n_components=2, init='random', n_iter=tsne_iter)
    X_2d = tsne.fit_transform(np.array(activations)[0:to_plot,:])
    X_2d -= X_2d.min(axis=0)
    X_2d /= X_2d.max(axis=0)
    return X_2d

def calc_tsne_grid(X_2d, out_dim):
    grid = np.dstack(np.meshgrid(np.linspace(0, 1, out_dim), np.linspace(0, 1, out_dim))).reshape(-1, 2)
    cost_matrix = cdist(grid, X_2d, "sqeuclidean").astype(np.float32)
    cost_matrix = cost_matrix * (100000 / cost_matrix.max())
    shp = cost_matrix.shape
    cost_matrix = np.hstack((cost_matrix, np.zeros((shp[0], shp[0] - shp[1]))))
    _, col_asses, _ = lapjv(cost_matrix)
    grid_jv = grid[col_asses]
    return grid_jv

def process_item(item):
    item['descriptor'] = [int(x*1000)/1000.0 for x in item['descriptor']]
    item['landmarks'] = [dict(x=int(x['x']), y=int(x['y'])) for x in item['landmarks']]
    return item

def create_tsne_image(grid_jv, img_collection, out_dim, to_plot, 
        res, offset, out_size,
        loader):
    # print('>>>', filename)
    img_dim = out_dim # 2**math.ceil(math.log2(out_dim))
    # img_ofs = math.floor((img_dim - out_dim)/2)
    info = dict(dim=img_dim, grid=[])
    out_res_x, out_res_y = res
    offset_x, offset_y = offset
    out_size_x, out_size_y = out_size
    out = np.zeros((img_dim*out_res_y, img_dim*out_res_x, 3))
    alpha = np.zeros((img_dim*out_res_y, img_dim*out_res_x, 1))
    used = set()
    for pos, item in zip(grid_jv, img_collection[0:to_plot]):
        pos_x = round(pos[1] * (out_dim - 1))# + img_ofs
        pos_y = round(pos[0] * (out_dim - 1))# + img_ofs
        assert (pos_x, pos_y) not in used
        used.add((pos_x, pos_y))
        img = loader.get_image(item['image'])
        h_range = pos_y * out_res_y + offset_y
        w_range = pos_x * out_res_x + offset_x
        out[h_range:h_range + out_size_y, w_range:w_range + out_size_x] = image.img_to_array(img)
        alpha[h_range:h_range + out_size_y, w_range:w_range + out_size_x] = 255*np.ones((out_size_y, out_size_x, 1))
        info['grid'].append(dict(pos=dict(x=pos_x, y=pos_y), item=process_item(item)))
    loader.fini()

    im = image.array_to_img(out)
    im.putalpha(image.array_to_img(alpha))
    # buff = BytesIO()
    # im.save(buff, format='png', quality=90)
    # buff.seek(0)
    return im, info

def create_tiles(filename, image: Image, out_dim, res, info, current_set):
    assert res[0] == res[1]
    dim_zoom = round(math.log2(out_dim))
    edge = 2**math.ceil(math.log2(out_dim)) * res[0]
    tile_size = 256
    max_cut_size = tile_size * 4
    max_zoom = info['max_zoom'] = 8
    min_zoom = info['min_zoom'] = 8 - dim_zoom

    with concurrent.futures.ThreadPoolExecutor(max_workers=32) as executor:
        for zoom in range(min_zoom, max_zoom + 1):
            num_cuts = (2**(zoom - min_zoom))
            cut_size = edge / num_cuts
            if cut_size > max_cut_size:
                scaledown_size = math.ceil((max_cut_size * num_cuts * out_dim * res[0]) / edge)
                cut_size = max_cut_size
                scaledown = image.resize((scaledown_size, scaledown_size), Image.NEAREST)
            else:
                scaledown = image

            for x in range(num_cuts):
                for y in range(num_cuts):
                    key = f'feature-tiles/{current_set}/{filename}/{zoom}/{x}/{y}'
                    left = math.floor(x * cut_size)
                    upper = math.floor(y * cut_size)
                    right = math.ceil((x+1) * cut_size - 1)
                    lower = math.ceil((y+1) * cut_size - 1)
                    tile: Image = scaledown.crop((left, upper, right, lower))
                    tile = tile.resize((tile_size, tile_size), resample=Image.BICUBIC)

                    buff = BytesIO()
                    tile.save(buff, format='png', quality=90)
                    buff.seek(0)
                    executor.submit(upload_fileobj_s3, buff, key, 'image/png')



IMAGES = [
    # ('noses', (200, 300), (0, 0)),
    # ('eyes', (300, 150), (300, 0)),
    # ('mouths', (300, 150), (600, 0)),
    # ('foreheads', (300, 150), (900, 0)),
    ('faces', (300, 300), (1200, 0)),
]

def main():
    perplexity = 50
    tsne_iter = 5000
    ids, activations = load_activations()
    out_dim = 30
    to_plot = 450
    side = 256
    ids = ids[:to_plot]
    loaders = []
    for filename, img_size, img_location in IMAGES:
        w, h = img_size
        dim = max(w, h)
        size = side/2
        loaders.append(ImageLoader([item['image'] for item in ids[0:to_plot]], [int(size*w/dim), int(size*h/dim), img_location, img_size]))
    loaders[0].start()

    try:
        current_config = requests.get('https://normalizing-us-files.fra1.digitaloceanspaces.com/tsne.json').json()
        current_set = current_config.get('set', 0)
    except:
        current_set = 0
    current_set += 1
    current_set %= 10

    print("Generating 2D representation.")
    X_2d = generate_tsne(activations, to_plot, perplexity, tsne_iter)
    print("Generating image grid (%dx%d, %d images)" % (out_dim, out_dim, len(ids)))
    grid = calc_tsne_grid(X_2d, out_dim)
    # buff, info = create_tsne_image(grid, ids, out_dim, to_plot, 
    #                                (100, 100), 
    #                                (24, 24),
    #                                (52, 52),
    #                                (1200, 0), (300, 300))
    # upload_fileobj_s3(buff, 'tsne.png', 'image/png')

    for filename, img_size, img_location in IMAGES:
        w, h = img_size
        dim = max(w, h)
        size = side/2
        size = (int(size*w/dim), int(size*h/dim))
        offset = (int((side - size[0])/2), int((side - size[1])/2))
        image, info = create_tsne_image(grid, ids, out_dim, to_plot,
                                        (side, side),  # res
                                        offset, size, loaders.pop(0))
        info['set'] = current_set
        if len(loaders) > 0:
            loaders[0].start()
        create_tiles(filename, image, out_dim, (side, side), info, current_set)

    json_buff = BytesIO()
    json_buff.write(json.dumps(info).encode('utf8'))
    json_buff.seek(0)
    upload_fileobj_s3(json_buff, 'tsne.json', 'application/json')


def calc_tsne_handler(event, context):
    main()

if __name__ == '__main__':
    main()
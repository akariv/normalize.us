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
from concurrent import futures
import queue
from skimage.transform import resize, rescale

from .net import upload_fileobj_s3

engine = create_engine(os.environ['DATABASE_URL'])
conn = engine.connect()
image_fetches = 0


class ThreadPoolExecutorWithQueueSizeLimit(futures.ThreadPoolExecutor):
    def __init__(self, maxsize=50, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._work_queue = queue.Queue(maxsize=maxsize)


def load_image(id, out_res_x, out_res_y, img_location, img_size):
    global image_fetches
    img_url = f'https://normalizing-us-files.fra1.cdn.digitaloceanspaces.com/{id}_face.png'
    img_data = requests.get(img_url).content
    img = Image.open(BytesIO(img_data))
    # img = img.crop((*img_location, img_location[0] + img_size[0], img_location[1] + img_size[1]))
    img = img.convert('RGB')
    img = img.resize((out_res_x, out_res_y), Image.NEAREST)
    # img = ImageOps.autocontrast(img)
    image_fetches += 1
    if image_fetches % 25 == 0:
        print('...', image_fetches)
    return img

def load_activations():
    print('Fetching descriptors')
    rows = conn.execution_options(stream_results=True).execute('select id, image, tournaments, votes, descriptor from faces order by tournaments desc limit 1000')
    ids = []
    activations = []
    for row in rows:
        id, image, tournaments, votes, descriptor = row
        ids.append(dict(
            id=id, image=image, tournaments=tournaments, votes=votes
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
    grid = np.dstack(np.meshgrid(np.linspace(0, 1, out_dim//2), np.linspace(0, 1, out_dim))).reshape(-1, 2)
    cost_matrix = cdist(grid, X_2d, "sqeuclidean").astype(np.float32)
    cost_matrix = cost_matrix * (100000 / cost_matrix.max())
    shp = cost_matrix.shape
    cost_matrix = np.hstack((cost_matrix, np.zeros((shp[0], shp[0] - shp[1]))))
    _, col_asses, _ = lapjv(cost_matrix)
    grid_jv = grid[col_asses]
    return grid_jv

def create_tsne_image(grid_jv, img_collection, out_dim, to_plot, 
        res, offset, out_size,
        img_location, img_size):
    # print('>>>', filename)
    img_dim = 2**math.ceil(math.log2(out_dim))
    img_ofs = math.floor((img_dim - out_dim)/2)
    info = dict(dim=img_dim, grid=[])
    out_res_x, out_res_y = res
    offset_x, offset_y = offset
    out_size_x, out_size_y = out_size
    out = np.zeros((img_dim*out_res_y // 2, img_dim*out_res_x, 3))
    alpha = np.zeros((img_dim*out_res_y // 2, img_dim*out_res_x, 1))
    used = set()
    for pos, item in zip(grid_jv, img_collection[0:to_plot]):
        pos_x = round(pos[1] * (out_dim - 1)) + img_ofs
        pos_y = round(pos[0] * (out_dim//2 - 1)) + img_ofs
        assert (pos_x, pos_y) not in used, 'POSITIONS: %d, %d' % (pos_x, pos_y)
        used.add((pos_x, pos_y))
        image_id = item['image']
        img = load_image(image_id, out_size_x, out_size_y, img_location, img_size)
        h_range = pos_y * out_res_y + offset_y
        w_range = pos_x * out_res_x + offset_x
        out[h_range:h_range + out_size_y, w_range:w_range + out_size_x] = image.img_to_array(img)
        alpha[h_range:h_range + out_size_y, w_range:w_range + out_size_x] = 255*np.ones((out_size_y, out_size_x, 1))
        info['grid'].append(dict(pos=dict(x=pos_x, y=pos_y), item=item))

    # print('Converting to image')
    # im = image.array_to_img(out)
    # im.putalpha(image.array_to_img(alpha))
    # buff = BytesIO()
    # im.save(buff, format='png', quality=90)
    # buff.seek(0)
    return out, alpha, info

def crop(img, x, y, w, h, tw, th):
    if img.shape[0] < h + y:
        h = img.shape[0] - y
    if img.shape[1] < w + x:
        w = img.shape[1] - x
    if (h, w) != img.shape:
        img = img[y:y+h, x:x+w]
    if w / h > tw / th:
        th = tw * h / w
    elif w / h < tw / th:
        tw = w * th / h
    scale = math.floor(min(w/tw, h/th))
    print(f'crop/resize {img.shape=}, {x=}, {y=}, {w=}, {h=}, {tw=}, {th=}, {scale=}')
    if scale > 1:
        img = rescale(img, (scale, scale, 1))
    img = resize(img, (th, tw))
    print('done!', img.shape)
    return img

def create_tiles(out, alpha, info, res):
    assert res[0] == res[1]
    out_dim = info['dim']
    dim_zoom = round(math.log2(out_dim))
    edge = out_dim * res[0]
    tile_size = 256
    max_zoom = 10
    min_zoom = info['min_zoom'] = 8 - dim_zoom
    # with ThreadPoolExecutorWithQueueSizeLimit(max_workers=1, maxsize=1) as executor:
    print(f'{out_dim=}, {dim_zoom=}, {edge=}, {min_zoom=}')
    for zoom in range(min_zoom, max_zoom + 1):
        num_cuts = (2**(zoom - min_zoom))
        cut_size = edge / num_cuts
        _cut_size = math.floor(cut_size)
        print(f'{zoom=}, {num_cuts=}, {cut_size=}, {_cut_size=}')
        for x in range(num_cuts):
            for y in range(num_cuts):
                key = f'tiles/{zoom}/{x}/{y}'
                left = math.floor(x * cut_size)
                upper = math.floor(y * cut_size)
                out_c = crop(out, left, upper, _cut_size, _cut_size, tile_size, tile_size)
                alpha_c = crop(alpha, left, upper, _cut_size, _cut_size, tile_size, tile_size)
                tile: Image = image.array_to_img(out_c)
                tile.putalpha(image.array_to_img(alpha_c))
                # tile = tile.resize((tile_size, tile_size), resample=Image.BICUBIC)

                buff = BytesIO()
                tile.save(buff, format='png', quality=100)
                del tile

                buff.seek(0)
                # executor.submit(upload_fileobj_s3, buff, key, 'image/png')
                upload_fileobj_s3(buff, key, 'image/png')


def create_tiles_efficiently(grid_jv, img_collection, out_dim, to_plot, 
                             res, offset, out_size,
                             img_location, img_size):
    assert res[0] == res[1]
    info = dict()

    info['dim'] = out_dim = 2**math.ceil(math.log2(out_dim))
    dim_zoom = round(math.log2(out_dim))
    edge = out_dim * res[0]
    tile_size = 256

    max_zoom = 10
    info['min_zoom'] = min_zoom = 8 - dim_zoom

    # with ThreadPoolExecutorWithQueueSizeLimit(max_workers=1, maxsize=1) as executor:
    print(f'{out_dim=}, {dim_zoom=}, {edge=}, {min_zoom=}')
    for zoom in range(min_zoom, max_zoom + 1):
        num_cuts = (2**(zoom - min_zoom))
        target_edge = num_cuts * tile_size
        scaledown = math.floor(edge / target_edge)
        scaleddown_res = (math.ceil(res[0] * scaledown), math.ceil(res[1] * scaledown))
        out, alpha, _info = create_tsne_image(
            grid_jv, img_collection, out_dim, to_plot, 
            scaleddown_res, offset, out_size,
            img_location, img_size
        )
        info['grid'] = _info['grid']
        scaleddown_edge = out_dim * scaleddown_res[0]
        scaleedown_cut_size = scaleddown_edge / num_cuts
        scaleedown_cut_size_ = math.floor(scaleedown_cut_size)

        print(f'{zoom=}, {num_cuts=}, {scaleedown_cut_size=}, {scaleedown_cut_size_=}, {scaledown=}, {scaleddown_res=}, {scaleddown_edge=}')
        for x in range(num_cuts):
            for y in range(num_cuts):
                key = f'tiles/{zoom}/{x}/{y}'
                left = math.floor(x * scaleedown_cut_size)
                upper = math.floor(y * scaleedown_cut_size)
                out_c = crop(out, left, upper, scaleedown_cut_size_, scaleedown_cut_size_, tile_size, tile_size)
                alpha_c = crop(alpha, left, upper, scaleedown_cut_size_, scaleedown_cut_size_, tile_size, tile_size)
                tile: Image = image.array_to_img(out_c)
                tile.putalpha(image.array_to_img(alpha_c))
                # tile = tile.resize((tile_size, tile_size), resample=Image.BICUBIC)

                buff = BytesIO()
                tile.save(buff, format='png', quality=100)
                del tile

                buff.seek(0)
                # executor.submit(upload_fileobj_s3, buff, key, 'image/png')
                upload_fileobj_s3(buff, key, 'image/png')
    return info
    


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
    out_dim = max(math.ceil(math.sqrt(len(activations))), 10)
    to_plot = int(1.5 * (out_dim ** 2))
    ids = ids[:to_plot]
    out_dim = out_dim * 2
    print("Generating 2D representation.")
    X_2d = generate_tsne(activations, to_plot, perplexity, tsne_iter)
    print("Generating image grid (%dx%d, %d images)" % (out_dim, out_dim // 2, len(ids)))
    grid = calc_tsne_grid(X_2d, out_dim)
    # buff, info = create_tsne_image(grid, ids, out_dim, to_plot, 
    #                                (100, 100), 
    #                                (24, 24),
    #                                (52, 52),
    #                                (1200, 0), (300, 300))
    # upload_fileobj_s3(buff, 'tsne.png', 'image/png')

    # print("Generating output image (%dx%d, %d images)" % (out_dim, out_dim // 2, len(ids)))
    # out, alpha, info = create_tsne_image(grid, ids, out_dim, to_plot, 
    #                                (600, 600), 
    #                                (144, 144),
    #                                (312, 312),
    #                                (1200, 0), (300, 300))

    # print('Creating tiles, out shape={}'.format(out.shape))
    # create_tiles(out, alpha, info, (600, 600))
    # # for filename, img_size, img_location in IMAGES:
    # #     create_tsne_image(grid, ids, out_dim, to_plot, img_size, 
    # #         img_location, 0.3, 'tsne-' + filename + '.png')

    info = create_tiles_efficiently(grid, ids, out_dim, to_plot, 
                                    (600, 600), 
                                    (144, 144),
                                    (312, 312),
                                    (1200, 0),
                                    (300, 300))


    json_buff = BytesIO()
    json_buff.write(json.dumps(info).encode('utf8'))
    json_buff.seek(0)
    upload_fileobj_s3(json_buff, 'tsne.json', 'application/json')


def calc_tsne_handler(event, context):
    main()

if __name__ == '__main__':
    main()
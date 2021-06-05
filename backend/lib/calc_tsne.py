import os
import math
from botocore import endpoint
import numpy as np
from PIL import Image, ImageOps
from lapjv import lapjv
from sklearn.manifold import TSNE
from scipy.spatial.distance import cdist
# from keras.applications.vgg16 import preprocess_input
from tensorflow.python.keras.preprocessing import image
from io import BytesIO
from sqlalchemy import create_engine
import boto3

engine = create_engine(os.environ['DATABASE_URL'])
conn = engine.connect()
# image_fetches = 0

def load_image(id, out_res_x, out_res_y, img_location, img_size):
    # global image_fetches
    row = conn.execute('select image from faces where id=%s' % id).fetchone()
    img_data = bytes(row[0])
    img = Image.open(BytesIO(img_data))
    img = img.crop((*img_location, img_location[0] + img_size[0], img_location[1] + img_size[1]))
    img = img.convert('RGB')
    img = img.resize((out_res_x, out_res_y), Image.NEAREST)
    img = ImageOps.autocontrast(img)
    # image_fetches += 1
    # if image_fetches % 100 == 0:
    #     print('...', image_fetches)
    return img

def load_activations():
    print('Fetching descriptors')
    rows = conn.execution_options(stream_results=True).execute('select id, descriptor from faces order by tournaments desc limit 1000')
    ids = []
    activations = []
    for row in rows:
        id = row[0]
        descriptor = row[1]
        ids.append(id)
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

def create_tsne_image(grid_jv, img_collection, out_dim, to_plot, res, img_location, img_size, filename):
    # print('>>>', filename)
    out_res_x, out_res_y = res
    out = np.ones((out_dim*out_res_y, out_dim*out_res_x, 3))
    for pos, id in zip(grid_jv, img_collection[0:to_plot]):
        img = load_image(id, out_res_x, out_res_y, img_location, img_size)
        h_range = int(np.floor(pos[0]* (out_dim - 1) * out_res_y))
        w_range = int(np.floor(pos[1]* (out_dim - 1) * out_res_x))
        out[h_range:h_range + out_res_y, w_range:w_range + out_res_x] = image.img_to_array(img)

    im = image.array_to_img(out)
    buff = BytesIO()
    im.save(buff, format='png', quality=90)
    buff.seek(0)
    return buff

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
    out_dim = math.ceil(math.sqrt(len(activations)) * 1.25)
    to_plot = int(out_dim ** 2)
    ids = ids[:to_plot]
    print("Generating 2D representation.")
    X_2d = generate_tsne(activations, to_plot, perplexity, tsne_iter)
    print("Generating image grid (%dx%d, %d images)" % (out_dim, out_dim, len(ids)))
    grid = calc_tsne_grid(X_2d, out_dim)
    buff = create_tsne_image(grid, ids, out_dim, to_plot, (100, 100), 
                            (1200, 0), (300, 300), 'tsne.png')

    s3_client = boto3.client(
        's3',
        endpoint_url='https://fra1.digitaloceanspaces.com',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        region_name='fra1',
    )
    response = s3_client.upload_fileobj(
        buff, os.environ['BUCKET_NAME'], 'tsne.png',
        ExtraArgs={'ACL': 'public-read', 'ContentType': 'image/png'}
    )
    print(response)
    # for filename, img_size, img_location in IMAGES:
    #     create_tsne_image(grid, ids, out_dim, to_plot, img_size, 
    #         img_location, 0.3, 'tsne-' + filename + '.png')


def calc_tsne_handler(event, context):
    main()

if __name__ == '__main__':
    main()
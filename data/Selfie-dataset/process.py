features = 'partial_faces is_female baby child teenager youth middle_age senior white black asian oval_face round_face heart_face smiling mouth_open frowning wearing_glasses wearing_sunglasses wearing_lipstick tongue_out duck_face black_hair blond_hair brown_hair red_hair curly_hair straight_hair braid_hair showing_cellphone using_earphone using_mirror braces wearing_hat harsh_lighting dim_lighting'
features = ['image', 'popularity'] + features.split()

if __name__ == '__main__':
    data = [row.split() for row in open('selfie_dataset.txt').read().split('\n')]
    data = [dict(zip(features, row)) for row in data if len(row)]
    data = filter(lambda r: r['partial_faces'] != '1', data)
    data = filter(lambda r: r['baby'] != '1', data)
    data = filter(lambda r: r['child'] != '1', data)
    data = filter(lambda r: r['wearing_glasses'] != '1', data)
    data = filter(lambda r: r['wearing_sunglasses'] != '1', data)
    data = filter(lambda r: r['mouth_open'] != '1', data)
    data = filter(lambda r: r['tongue_out'] != '1', data)
    data = filter(lambda r: r['duck_face'] != '1', data)
    data = filter(lambda r: r['showing_cellphone'] != '1', data)
    data = filter(lambda r: r['using_mirror'] != '1', data)
    data = filter(lambda r: r['wearing_hat'] != '1', data)
    data = filter(lambda r: r['harsh_lighting'] != '1', data)
    data = filter(lambda r: r['dim_lighting'] != '1', data)
    data = list(r['image'] for r in data)
    with open('images.ts', 'w') as ts:
        ts.write('export const IMAGES=%r;' % data)
    print(data[:10])
    print(len(data))
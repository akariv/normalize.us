from io import BytesIO
import os
import boto3
import logging

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
}

s3_client = None
_uploaded = 0


def get_client():
    global s3_client
    if s3_client is None:
        s3_client = boto3.client(
            's3',
            endpoint_url='https://fra1.digitaloceanspaces.com',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            region_name='fra1',
        )
    return s3_client


def upload_fileobj_s3(buff: BytesIO, filename, content_type):
    global _uploaded
    bucket = os.environ['BUCKET_NAME']
    client = get_client()

    success = False
    for _ in range(3):
        client.upload_fileobj(
            buff, bucket, filename,
            ExtraArgs={'ACL': 'public-read', 'ContentType': content_type}
        )
        head = client.head_object(Bucket=bucket, Key=filename)
        success = bool(head['ContentLength'])
        if success:
            break
    
    if success:
        _uploaded += 1
        if _uploaded % 100 == 0 or _uploaded == 1:
            print('UPLOADED #{}: {}'.format(_uploaded, filename))
    else:
        logging.error('FAILED TO UPLOAD {} to {} ({} bytes)'.format(filename, bucket, buff.getbuffer().nbytes))
    del buff
    return success

import os
import boto3

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
}

s3_client = None


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


def upload_fileobj_s3(buff, filename, content_type):
    client = get_client()
    client.upload_fileobj(
        buff, os.environ['BUCKET_NAME'], filename,
        ExtraArgs={'ACL': 'public-read', 'ContentType': content_type}
    )

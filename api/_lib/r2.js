import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
const FOLDER = 'delrey-photos';

async function getManifest() {
  try {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: `${FOLDER}/manifest.json` })
    );
    const text = await Body.transformToString();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${FOLDER}/manifest.json`,
      Body: JSON.stringify(manifest),
      ContentType: 'application/json',
    })
  );
}

export async function listPhotos() {
  const [{ Contents = [] }, manifest] = await Promise.all([
    s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${FOLDER}/` })),
    getManifest(),
  ]);

  return Contents
    .filter(obj => obj.Key !== `${FOLDER}/` && obj.Key !== `${FOLDER}/manifest.json`)
    .map(obj => {
      const id = obj.Key.replace(`${FOLDER}/`, '').replace(/\.[^.]+$/, '');
      return {
        id,
        url: `${PUBLIC_URL}/${obj.Key}`,
        key: obj.Key,
        description: manifest[id]?.description || '',
        uploadedAt: obj.LastModified?.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

export async function uploadPhoto(id, buffer, contentType, description) {
  const ext = contentType === 'image/png' ? 'png'
    : contentType === 'image/webp' ? 'webp'
    : 'jpg';
  const key = `${FOLDER}/${id}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = `${PUBLIC_URL}/${key}`;

  if (description) {
    const manifest = await getManifest();
    manifest[id] = { description, url };
    await saveManifest(manifest);
  }

  return { id, url, key, description: description || '' };
}

export async function deletePhoto(id) {
  const extensions = ['jpg', 'png', 'webp'];
  await Promise.all(
    extensions.map(ext =>
      s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `${FOLDER}/${id}.${ext}` }))
        .catch(() => {})
    )
  );

  const manifest = await getManifest();
  if (manifest[id]) {
    delete manifest[id];
    await saveManifest(manifest);
  }
}

export async function getPhotoMeta(id) {
  const manifest = await getManifest();
  return manifest[id] || null;
}

export async function getPhotoStream(id) {
  const { Contents = [] } = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${FOLDER}/${id}.` })
  );
  if (!Contents.length) return null;

  const key = Contents[0].Key;
  const ext = key.split('.').pop();
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const { Body } = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return { Body, contentType };
}

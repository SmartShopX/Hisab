export interface StoredMediaAsset {
  assetId: string;
  storeId: string;
  productId?: string;
  assetType: 'original' | 'processed' | 'thumbnail' | 'video';
  mimeType: string;
  size?: number;
  width?: number;
  height?: number;
  storageProvider: 'inline-data' | 'gcs' | 's3' | 'local';
  storageKey: string;
  publicUrl: string;
  createdAt: string;
}

export interface MediaStorageProvider {
  name: string;
  upload(params: {
    dataUrl?: string;
    buffer?: Buffer;
    filename: string;
    mimeType: string;
    storeId: string;
    productId?: string;
    assetType: 'original' | 'processed' | 'thumbnail' | 'video';
  }): Promise<StoredMediaAsset>;
  getUrl(assetId: string): Promise<string | null>;
  delete(assetId: string): Promise<boolean>;
  exists(assetId: string): Promise<boolean>;
}

export class InlineDataUrlStorageProvider implements MediaStorageProvider {
  public name = 'Inline Data Storage Engine';
  private assets: Map<string, StoredMediaAsset> = new Map();

  public async upload(params: {
    dataUrl?: string;
    buffer?: Buffer;
    filename: string;
    mimeType: string;
    storeId: string;
    productId?: string;
    assetType: 'original' | 'processed' | 'thumbnail' | 'video';
  }): Promise<StoredMediaAsset> {
    const assetId = `ast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const publicUrl = params.dataUrl || (params.buffer ? `data:${params.mimeType};base64,${params.buffer.toString('base64')}` : '');

    const asset: StoredMediaAsset = {
      assetId,
      storeId: params.storeId,
      productId: params.productId,
      assetType: params.assetType,
      mimeType: params.mimeType,
      size: params.buffer?.length || publicUrl.length,
      storageProvider: 'inline-data',
      storageKey: `stores/${params.storeId}/${params.assetType}/${params.filename}`,
      publicUrl,
      createdAt: new Date().toISOString(),
    };

    this.assets.set(assetId, asset);
    return asset;
  }

  public async getUrl(assetId: string): Promise<string | null> {
    const asset = this.assets.get(assetId);
    return asset ? asset.publicUrl : null;
  }

  public async delete(assetId: string): Promise<boolean> {
    return this.assets.delete(assetId);
  }

  public async exists(assetId: string): Promise<boolean> {
    return this.assets.has(assetId);
  }
}

export const mediaStorage = new InlineDataUrlStorageProvider();

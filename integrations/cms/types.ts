export interface WixDataItem {
  _id: string;
  _createdDate?: Date | string;
  _updatedDate?: Date | string;
  [key: string]: unknown;
}

export interface WixDataQueryResult<T = WixDataItem> {
  items: T[];
  totalCount?: number;
}

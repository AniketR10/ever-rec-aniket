import { IDbFolderData } from 'app/interfaces/IEditorImage';
import { ItemType, MixedItemType } from 'app/interfaces/ItemType';
import store from 'app/store/panel';
import PanelAC from 'app/store/panel/actions/PanelAC';
import { changeFolderItemsAPI } from '../api/image';
import { changeVideoFolderItemsAPI } from '../api/video';
import { iDataResponseParser } from './iDataResponseParser';

// The server applies the change atomically, so concurrent changes can't
// overwrite each other or the folder's other fields. Returns the new count.
const changeFolderItems = async (
  folderId: string,
  type: ItemType,
  change: number,
): Promise<number | null> => {
  const response =
    type == 'image'
      ? await changeFolderItemsAPI(folderId, change)
      : await changeVideoFolderItemsAPI(folderId, change);

  return iDataResponseParser<typeof response.data>(response)?.items ?? null;
};

const updateFolderInExplorer = (folder: IDbFolderData, type: ItemType) => {
  store.dispatch(
    type == 'image'
      ? PanelAC.updateExplorerFolderData({ folder })
      : PanelAC.updateExplorerVideoFolderData({ folder }),
  );
};

const increaseFolderItems = async (
  folderData: IDbFolderData,
  type: ItemType,
  index: number,
) => {
  const items = await changeFolderItems(folderData.id, type, index);
  if (items !== null) updateFolderInExplorer({ ...folderData, items }, type);
};

const decreaseFolderItems = async (
  folderData: IDbFolderData,
  type: MixedItemType,
  index: number,
) => {
  if (type == 'mixed') return;

  const items = await changeFolderItems(folderData.id, type, -index);
  if (items !== null) updateFolderInExplorer({ ...folderData, items }, type);
};

// For callers that only have the folder id; they reload the explorer anyway.
const adjustImageFolderItems = async (folderId: string, change: number) => {
  await changeFolderItems(folderId, 'image', change);
};

export { increaseFolderItems, decreaseFolderItems, adjustImageFolderItems };

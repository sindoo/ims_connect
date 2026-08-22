import {deleteRequest, getRequest} from '../api/ApiManager';
import {getTime, set} from 'date-fns';
import _ from 'lodash';
import {useSelector} from 'react-redux';

function ChildPictureService() {
  const {selectedChild} = useSelector((state: any) => state.child);
  const {user} = useSelector((state: any) => state.user);

  return {
    getPictureData: async () => {
      const imageListRequest: any = await getRequest(
        '',
        `/extra/images/enfant/${selectedChild.id}/${user?.id}`,
      );
      const imageRequestList: any =
        imageListRequest._embedded !== undefined
          ? imageListRequest._embedded.albumPictureDTOModelList
          : [];

      const imageListReq = imageRequestList.map((image: any) => {
        const imageDate = set(image.common.miseajour, {
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        return {
          ...image,
          dateImage: getTime(imageDate),
        };
      });

      let pictureList: any = [];
      const groupedData = _.groupBy(imageListReq, 'dateImage');
      Object.keys(groupedData).forEach(function (key, index) {
        const data = {
          picDate: key,
          picList: groupedData[key],
        };
        pictureList.push(data);
      });

      pictureList = pictureList.sort(function (a: any, b: any) {
        return a.picDate - b.picDate;
      });

      pictureList.reverse();
      return pictureList;
    },
    deletePicture: async (pictureIdList: any) => {
      return await deleteRequest('', '/extra/images/bouquet', pictureIdList);
    },
  };
}

export default ChildPictureService;

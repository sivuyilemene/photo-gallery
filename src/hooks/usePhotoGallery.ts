import { useState, useEffect } from 'react';
import { isPlatform } from '@ionic/react';

import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory} from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor, WebView } from '@capacitor/core';


export interface UserPhoto {
    filepath: string;
    webviewPath?: string;
  }


const PHOTO_STORAGE = 'photos';
export function usePhotoGallery() {
    // an array to store each photo captured
    const [photos, setPhotos] = useState<UserPhoto[]>([]);
    useEffect(() => {
      const loadSaved = async() => {
        const {value} = await Preferences.get({key: PHOTO_STORAGE});
        const photosInPreferences = (value ? JSON.parse(value) : []) as UserPhoto[];

        for (let photo of photosInPreferences) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
        setPhotos(photosInPreferences);
      };
      loadSaved();
    }, []);

    useEffect(() => {
      const loadSaved = async () => {
        const { value } = await Preferences.get({ key: PHOTO_STORAGE });
        const photosInPreferences = (value ? JSON.parse(value) : []) as UserPhoto[];
    
        for (let photo of photosInPreferences) {
          const file = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
        setPhotos(photosInPreferences);
      };
      loadSaved();
    }, []);

    const takePhoto = async () => {

        // opens the camera of users device
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });

        // create the file name of the photo
        const fileName = Date.now() + '.jpeg';
        const savedFileImage = await savePicture(photo, fileName);
        // add photos taken in an array
        const newPhotos = [savedFileImage, ...photos];
        setPhotos(newPhotos);
        Preferences.set({key: PHOTO_STORAGE, value: JSON.stringify(newPhotos)})

    };

    const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
        let base64Data = await base64FromPath(photo.webPath!);
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Data,
        });
    
        // Use webPath to display the new image instead of base64 since it's
        // already loaded into memory
        return {
          filepath: fileName,
          webviewPath: photo.webPath,
        };
      }
    };

    const deletePhoto = async (photo: UserPhoto) => {
      // Remove this photo from the Photos reference data array
      const newPhotos = photos.filter((p) => p.filepath !== photo.filepath);
    
      // Update photos array cache by overwriting the existing photo array
      Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
    
      // delete photo file from filesystem
      const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
      await Filesystem.deleteFile({
        path: filename,
        directory: Directory.Data,
      });
      setPhotos(newPhotos);
    };
    return {
        photos,
        takePhoto,
        deletePhoto,
    };
}

export async function base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string');
        }
      };
      reader.readAsDataURL(blob);
    });
}




    
   


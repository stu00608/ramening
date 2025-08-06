"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface PhotoCropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCropComplete: (croppedFile: File, category: string) => void;
}

const photoCategories = [
  "拉麵",
  "副餐",
  "店內環境",
  "店家外觀",
  "菜單",
  "其他",
];

// 將 Canvas 轉換為 File
function canvasToFile(
  canvas: HTMLCanvasElement,
  fileName: string
): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type: "image/jpeg" });
          resolve(file);
        }
      },
      "image/jpeg",
      0.8
    );
  });
}

// 獲取裁切後的圖片
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvasToFile(canvas, fileName);
}

export function PhotoCropModal({
  open,
  onOpenChange,
  file,
  onCropComplete,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [category, setCategory] = useState("拉麵");
  const [imageSrc, setImageSrc] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  // 當檔案改變時，創建圖片 URL
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;

      // 設定 1:1 裁切框，預設為圖片中央
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 50,
          },
          1, // 1:1 比例
          width,
          height
        ),
        width,
        height
      );

      setCrop(crop);
    },
    []
  );

  // 當 modal 開啟且有檔案時，創建圖片 URL
  useEffect(() => {
    if (open && file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageSrc("");
    }
  }, [open, file]);

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop || !file) {
      return;
    }

    try {
      const croppedFile = await getCroppedImg(
        imgRef.current,
        completedCrop,
        file.name
      );

      onCropComplete(croppedFile, category);
      onOpenChange(false);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setImageSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>照片裁切</DialogTitle>
          <DialogDescription>
            請將照片裁切為 1:1 比例並選擇分類
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 照片分類選擇 */}
          <div className="space-y-2">
            <Label>照片分類</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photoCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 照片裁切區域 */}
          {imageSrc && (
            <div className="flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // 1:1 比例
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="待裁切照片"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-96"
                />
              </ReactCrop>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleCropComplete} disabled={!completedCrop}>
            確認裁切
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

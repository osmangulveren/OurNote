import { ProductionStage } from "@prisma/client";

export const PRODUCTION_STAGE_LABEL: Record<ProductionStage, string> = {
  WAITING: "Bekliyor",
  FRAME_BUILDING: "İskelet yapılıyor",
  UPHOLSTERY: "Döşeme yapılıyor",
  QUALITY_CHECK: "Kalite kontrol",
  PACKAGING: "Paketlendi",
  READY_FOR_LOADING: "Yüklemeye hazır",
  LOADED_ON_TRUCK: "TIR'a yüklendi",
  DEPARTED: "Yola çıktı",
  DELIVERED: "Teslim edildi",
};

export const PRODUCTION_STAGE_ORDER: ProductionStage[] = [
  "WAITING",
  "FRAME_BUILDING",
  "UPHOLSTERY",
  "QUALITY_CHECK",
  "PACKAGING",
  "READY_FOR_LOADING",
  "LOADED_ON_TRUCK",
  "DEPARTED",
  "DELIVERED",
];

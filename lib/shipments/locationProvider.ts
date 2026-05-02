/**
 * Konum sağlayıcı arayüzü.
 *
 * MVP'de "BrowserDriverProvider" kullanılır — şoför /driver/[token] sayfasını
 * açar, tarayıcının geolocation API'siyle her N saniyede bir konum gönderir.
 *
 * Telematik (Mobiliz, Arvento, vb.) entegrasyonu için aynı arayüzü kullanan
 * yeni bir provider yazılır; veriler aynı Shipment tablosunda toplanır.
 */

import { prisma } from "@/lib/prisma";

export interface LocationPing {
  lat: number;
  lng: number;
  at: Date;
}

export interface LocationProvider {
  /** Sevkiyatın son konumunu getir. */
  latest(shipmentId: string): Promise<LocationPing | null>;
  /** Sağlayıcıdan gelen yeni bir ping kaydet. */
  recordPing(shipmentId: string, lat: number, lng: number): Promise<void>;
}

class DbBackedProvider implements LocationProvider {
  async latest(shipmentId: string) {
    const s = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!s || s.lastLat == null || s.lastLng == null || !s.lastPingAt) return null;
    return { lat: s.lastLat, lng: s.lastLng, at: s.lastPingAt };
  }
  async recordPing(shipmentId: string, lat: number, lng: number) {
    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { lastLat: lat, lastLng: lng, lastPingAt: new Date() },
    });
  }
}

/**
 * Şoförün tarayıcısından gelen konum güncellemelerini DB'ye yazar.
 */
export class BrowserDriverProvider extends DbBackedProvider {}

/**
 * STUB. Gerçek bir telematik servis (Mobiliz, Arvento, vb.) bağlandığında
 * `recordPing` artık aktarıcı tarafından çağrılır; `latest` aynı tabloyu okur.
 *
 * Üretime alınırken: bu sınıfın altında vendor SDK'sı/HTTP istemcisi tutulur,
 * `latest` tercihen vendor'dan canlı çekilir, fallback olarak DB kullanılabilir.
 */
export class TelematikProvider extends DbBackedProvider {
  // TODO: vendor SDK entegrasyonu
}

export function getLocationProvider(): LocationProvider {
  // İleride: process.env.LOCATION_PROVIDER === "mobiliz" → new TelematikProvider()
  return new BrowserDriverProvider();
}

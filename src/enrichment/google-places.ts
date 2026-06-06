import axios from 'axios';

export interface PlacesResult {
  mapsUrl: string;
  streetviewUrl: string;
  placesFlag: string;
  scoreAdj: number;
  placesStatus: string;
  phoneNumber: string;
}

const PLACES_FIND_URL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
const PLACES_DETAIL_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const STREETVIEW_BASE = 'https://maps.googleapis.com/maps/api/streetview';

const BUSINESS_TYPES = new Set([
  'restaurant', 'bar', 'cafe', 'food', 'lodging', 'hotel', 'store',
  'supermarket', 'grocery_or_supermarket', 'health', 'hospital', 'doctor',
  'pharmacy', 'dentist', 'gym', 'school', 'university', 'establishment',
  'point_of_interest', 'night_club', 'spa', 'beauty_salon',
]);

const RESIDENTIAL_TYPES = new Set([
  'premise', 'street_address', 'route', 'subpremise',
  'neighborhood', 'postal_code', 'political',
]);

export async function enrichWithGooglePlaces(
  address: string,
  postcode: string | undefined,
  apiKey: string
): Promise<PlacesResult> {
  const fullAddress = [address, postcode].filter(Boolean).join(' ');
  const encoded = encodeURIComponent(fullAddress);
  const mapsUrl = `https://www.google.com/maps/search/${encoded}`;
  const streetviewUrl = `${STREETVIEW_BASE}?size=640x400&location=${encoded}&fov=90&key=${apiKey}`;

  const empty: PlacesResult = {
    mapsUrl,
    streetviewUrl,
    placesFlag: '',
    scoreAdj: 0,
    placesStatus: '',
    phoneNumber: '',
  };

  try {
    const findResp = await axios.get(PLACES_FIND_URL, {
      params: {
        input: fullAddress,
        inputtype: 'textquery',
        fields: 'place_id,name,types,business_status,geometry',
        key: apiKey,
      },
      timeout: 15_000,
    });

    const candidates = findResp.data?.candidates ?? [];
    if (!candidates.length) {
      return { ...empty, placesFlag: 'google: no listing found' };
    }

    const c = candidates[0] as {
      place_id?: string;
      name?: string;
      types?: string[];
      business_status?: string;
      geometry?: { location?: { lat?: number; lng?: number } };
    };

    const types = c.types ?? [];
    const status = c.business_status ?? '';
    const loc = c.geometry?.location;
    const placeId = c.place_id ?? '';

    let phoneNumber = '';
    if (placeId) {
      try {
        const detailResp = await axios.get(PLACES_DETAIL_URL, {
          params: { place_id: placeId, fields: 'formatted_phone_number', key: apiKey },
          timeout: 8_000,
        });
        phoneNumber = detailResp.data?.result?.formatted_phone_number ?? '';
      } catch {
        // non-fatal
      }
    }

    // Upgrade Street View URL to coordinates if available
    let svUrl = streetviewUrl;
    let mUrl = mapsUrl;
    if (loc?.lat && loc?.lng) {
      svUrl = `${STREETVIEW_BASE}?size=640x400&location=${loc.lat},${loc.lng}&fov=90&key=${apiKey}`;
      mUrl = `https://www.google.com/maps/@${loc.lat},${loc.lng},18z`;
    }

    const isBusiness = status === 'OPERATIONAL' || types.some(t => BUSINESS_TYPES.has(t));
    const isResidential = !isBusiness && types.every(t => RESIDENTIAL_TYPES.has(t));
    const typeLabel = types[0]?.replace(/_/g, ' ') ?? 'unknown';

    if (isBusiness) {
      return { mapsUrl: mUrl, streetviewUrl: svUrl, placesFlag: `google: verified business (${typeLabel})`, scoreAdj: 5, placesStatus: status, phoneNumber };
    } else if (isResidential) {
      return { mapsUrl: mUrl, streetviewUrl: svUrl, placesFlag: 'google: residential/non-business address', scoreAdj: -8, placesStatus: status, phoneNumber };
    }
    return { mapsUrl: mUrl, streetviewUrl: svUrl, placesFlag: `google: ${typeLabel}`, scoreAdj: 0, placesStatus: status, phoneNumber };

  } catch {
    return empty;
  }
}

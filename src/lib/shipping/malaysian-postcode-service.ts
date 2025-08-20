/**
 * Malaysian Postcode Location Service
 * Based on EasyParcel Individual API v1.4.0 documentation
 * Reference: Malaysia_Individual_1.4.0.0.pdf Appendix A & B
 */

import type { MalaysianState } from './easyparcel-service';

export interface LocationData {
  state: MalaysianState;
  stateCode: string;
  stateName: string;
  city: string;
  area?: string;
  zone: 'west' | 'east';
}

export interface PostcodeRange {
  start: number;
  end: number;
  state: MalaysianState;
  stateName: string;
  cities: Array<{
    name: string;
    postcodes: number[];
    areas?: string[];
  }>;
}

// Comprehensive Malaysian postcode mapping based on EasyParcel documentation
const MALAYSIAN_POSTCODE_DATABASE: PostcodeRange[] = [
  // Kuala Lumpur & Putrajaya
  {
    start: 50000,
    end: 60999,
    state: 'KUL',
    stateName: 'Kuala Lumpur',
    cities: [
      {
        name: 'Kuala Lumpur',
        postcodes: [50000, 50050, 50088, 50100, 50150, 50200, 50250, 50300, 50350, 50400, 50450, 50460, 50470, 50480, 50490, 50500, 50540, 50550, 50560, 50570, 50576, 50580, 50586, 50588, 50590, 50592, 50594, 50596, 50598, 50603, 50604, 50608, 50609, 50610, 50612, 50614, 50620, 50622, 50626, 50630, 50632, 50634, 50636, 50638, 50640, 50642, 50644, 50646, 50648, 50650, 50652, 50658, 50660, 50664, 50670, 50672, 50676, 50677, 50678, 50680, 50682, 50684, 50686, 50688, 50690, 50694, 50700, 50706, 50708, 50710, 50712, 50714, 50718, 50720, 50722, 50724, 50726, 50728, 50730, 50732, 50734, 50736, 50738, 50740, 50742, 50744, 50746, 50748, 50750, 50752, 50754, 50756, 50758, 50760, 50762, 50764, 50766, 50768, 50770, 50772, 50774, 50776, 50778, 50780, 50782, 50784, 50786, 50788, 50790, 50792, 50794, 50796, 50798, 50800, 50802, 50804, 50806, 50808, 50810, 50812, 50814, 50816, 50818, 50820, 50830, 50840, 50850, 50860, 50888, 50900, 50906, 50907, 50908, 50909, 50910, 50911, 50912, 50913, 50914, 50915, 50916, 50917, 50918, 50919, 50920, 50921, 50922, 50923, 50924, 50925, 50926, 50927, 50928, 50929, 50930, 50931, 50932, 50933, 50934, 50935, 50936, 50937, 50938, 50939, 50940, 50941, 50942, 50943, 50944, 50945, 50946, 50947, 50948, 50949, 50950, 50958, 50960, 50962, 50964, 50966, 50968, 50970, 50972, 50974, 50976, 50978, 50980, 50982, 50984, 50986, 50988, 50990, 50992, 50994, 50996, 50998],
        areas: ['Bukit Bintang', 'KLCC', 'Bangsar', 'Cheras', 'Setapak', 'Wangsa Maju', 'Kepong', 'Sentul']
      },
      {
        name: 'Putrajaya',
        postcodes: [62000, 62007, 62050, 62100, 62150, 62200, 62250, 62300, 62502, 62504, 62506, 62508, 62510, 62512, 62514, 62516, 62518, 62520, 62522, 62524, 62526, 62528, 62530, 62532, 62534, 62536, 62538, 62540, 62542, 62544, 62546, 62548, 62550, 62551, 62570, 62574, 62576, 62582, 62584, 62590, 62592, 62594, 62596, 62602, 62605, 62616, 62618, 62620, 62623, 62624, 62628, 62630, 62632, 62648, 62650, 62652, 62654, 62662, 62664, 62668, 62670, 62672, 62674, 62675, 62677, 62686, 62688, 62690, 62692, 62988],
        areas: ['Precinct 1', 'Precinct 8', 'Precinct 9', 'Precinct 10', 'Precinct 11']
      }
    ]
  },

  // Selangor
  {
    start: 40000,
    end: 48999,
    state: 'SEL',
    stateName: 'Selangor',
    cities: [
      {
        name: 'Shah Alam',
        postcodes: [40000, 40100, 40150, 40160, 40170, 40200, 40300, 40400, 40450, 40460, 40470, 40500, 40503, 40505, 40507, 40508, 40512, 40517, 40529, 40532, 40534, 40536, 40538, 40540, 40542, 40544, 40546, 40548, 40550, 40551, 40564, 40570, 40572, 40576, 40578, 40582, 40590, 40592, 40594, 40596, 40598, 40600, 40604, 40607, 40608, 40610, 40612, 40614, 40620, 40622, 40624, 40626, 40628, 40632, 40646, 40648, 40660, 40664, 40670, 40672, 40674, 40676, 40680, 40682, 40684, 40686, 40688, 40690, 40692, 40694, 40700, 40702, 40704, 40706, 40708, 40710, 40712, 40714, 40716, 40718, 40720, 40722, 40724, 40726, 40728, 40730, 40732, 40734, 40736, 40738, 40740, 40742, 40744, 40746, 40748, 40750, 40800, 40802, 40804, 40806, 40808, 40810, 40990, 40995],
        areas: ['Seksyen 1', 'Seksyen 2', 'Seksyen 7', 'Seksyen 14', 'Seksyen 15', 'Glenmarie', 'Kota Kemuning']
      },
      {
        name: 'Petaling Jaya',
        postcodes: [46000, 46050, 46100, 46150, 46160, 46200, 46300, 46350, 46400, 46506, 46547, 46549, 46551, 46564, 46582, 46598, 46662, 46667, 46672, 46675, 46700, 46710, 46720, 46730, 46740, 46750, 46760, 46770, 46781, 46782, 46783, 46784, 46785, 46786, 46787, 46788, 46789, 46790, 46791, 46792, 46793, 46794, 46795, 46796, 46797, 46798, 46799, 46800, 46801, 46802, 46803, 46804, 46805, 46806, 46860, 46870, 46960, 46962, 46964, 46966, 46968, 46970, 46972, 46974, 46976, 46978, 46980, 46990, 46995, 47000, 47100, 47120, 47130, 47140, 47160, 47170, 47180, 47190, 47200, 47300, 47301, 47400, 47410, 47500, 47600, 47610, 47620, 47630, 47640, 47650, 47800, 47810, 47820, 47830, 47840, 47850],
        areas: ['PJ Old Town', 'PJ New Town', 'Damansara', 'Kelana Jaya', 'Bandar Utama', 'Kota Damansara']
      },
      {
        name: 'Subang Jaya',
        postcodes: [47500, 47610],
        areas: ['USJ', 'Subang Jaya', 'Bandar Sunway']
      },
      {
        name: 'Klang',
        postcodes: [41000, 41050, 41100, 41150, 41200, 41250, 41300, 41350, 41400, 41450, 41500, 41506, 41560, 41586, 41590, 41596, 41598, 41604, 41605, 41606, 41607, 41608, 41609, 41610, 41612, 41614, 41615, 41616, 41617, 41618, 41619, 41620, 41621, 41622, 41623, 41624, 41626, 41630, 41632, 41634, 41636, 41638, 41640, 41644, 41646, 41648, 41650, 41652, 41660, 41664, 41665, 41666, 41667, 41668, 41670, 41672, 41674, 41675, 41676, 41677, 41700, 41702, 41704, 41706, 41708, 41710, 41712, 41714, 41716, 41718, 41720, 41722, 41724, 41900, 41902, 41904, 41906, 41908, 41910, 41912, 41914, 41916, 41918, 41920, 41922, 41924, 41926, 41928, 41929, 41990, 41995, 42000, 42009, 42100, 42200, 42300, 42400, 42500, 42600, 42700, 42960, 42970],
        areas: ['Klang Town', 'Port Klang', 'Bandar Botanik', 'Bandar Bukit Tinggi']
      }
    ]
  },

  // Johor
  {
    start: 79000,
    end: 86999,
    state: 'JOH',
    stateName: 'Johor',
    cities: [
      {
        name: 'Johor Bahru',
        postcodes: [79000, 79100, 79150, 79200, 79250, 79300, 79350, 79400, 79450, 79500, 79503, 79505, 79513, 79517, 79518, 79520, 79523, 79526, 79529, 79532, 79534, 79538, 79540, 79542, 79546, 79548, 79550, 79551, 79552, 79553, 79554, 79555, 79556, 79576, 79590, 79592, 79594, 79596, 79601, 79603, 79605, 79606, 79612, 79620, 79622, 79624, 79626, 79628, 79630, 79632, 79634, 79646, 79648, 79650, 79652, 79654, 79656, 79658, 79660, 79664, 79673, 79675, 79683, 79685, 79686, 79690, 79692, 79902, 79906, 79908, 79910, 79912, 79914, 79916, 79990, 79995, 80000, 80050, 80100, 80150, 80200, 80250, 80300, 80350, 80400, 80450, 80500, 80503, 80506, 80508, 80512, 80540, 80550, 80551, 80558, 80560, 80564, 80566, 80568, 80570, 80572, 80576, 80578, 80582, 80584, 80586, 80588, 80590, 80592, 80594, 80596, 80604, 80622, 80626, 80628, 80630, 80632, 80648, 80660, 80662, 80664, 80670, 80672, 80674, 80676, 80990, 80995, 81000, 81100, 81200, 81300, 81310, 81400, 81500, 81550, 81560, 81700, 81750, 81800, 81900, 81910],
        areas: ['JB City Centre', 'Taman Johor Jaya', 'Skudai', 'Nusajaya', 'Gelang Patah', 'Danga Bay']
      },
      {
        name: 'Batu Pahat',
        postcodes: [83000, 83100, 83200, 83300, 83400, 83500, 83600, 83700, 83800, 83900],
        areas: ['Batu Pahat Town', 'Yong Peng', 'Ayer Hitam']
      },
      {
        name: 'Kluang',
        postcodes: [86000, 86100, 86200, 86300, 86400, 86500, 86600, 86700, 86800, 86900],
        areas: ['Kluang Town', 'Simpang Renggam']
      }
    ]
  },

  // Penang
  {
    start: 10000,
    end: 14999,
    state: 'PNG',
    stateName: 'Pulau Pinang',
    cities: [
      {
        name: 'George Town',
        postcodes: [10000, 10050, 10100, 10150, 10200, 10250, 10300, 10350, 10400, 10450, 10460, 10470, 10500, 10503, 10505, 10506, 10508, 10512, 10516, 10517, 10518, 10519, 10520, 10530, 10532, 10534, 10536, 10538, 10540, 10542, 10544, 10546, 10548, 10550, 10551, 10552, 10564, 10566, 10570, 10576, 10578, 10582, 10590, 10592, 10594, 10596, 10598, 10604, 10606, 10608, 10609, 10612, 10620, 10622, 10623, 10624, 10626, 10628, 10630, 10632, 10634, 10636, 10646, 10648, 10650, 10660, 10670, 10672, 10673, 10674, 10675, 10676, 10677, 10690, 10692, 10710, 10720, 10730, 10740, 10750, 10760, 10770, 10990, 10995],
        areas: ['Georgetown', 'Gurney Drive', 'Komtar', 'Prangin Mall', 'Armenian Street']
      },
      {
        name: 'Bayan Lepas',
        postcodes: [11900, 11920, 11950, 11960],
        areas: ['Bayan Lepas Industrial Zone', 'Penang International Airport']
      },
      {
        name: 'Butterworth',
        postcodes: [12000, 12100, 12200, 12300, 12700, 12800, 12900, 13000, 13050, 13100, 13200, 13300, 13400],
        areas: ['Butterworth Town', 'Seberang Jaya', 'Perai Industrial Area']
      }
    ]
  },

  // Perak
  {
    start: 30000,
    end: 36999,
    state: 'PRK',
    stateName: 'Perak',
    cities: [
      {
        name: 'Ipoh',
        postcodes: [30000, 30010, 30020, 30100, 30200, 30300, 30350, 30400, 30450, 30500, 30503, 30504, 30505, 30506, 30508, 30512, 30514, 30516, 30518, 30520, 30536, 30540, 30544, 30546, 30548, 30550, 30551, 30564, 30566, 30570, 30576, 30578, 30582, 30590, 30592, 30594, 30596, 30604, 30606, 30609, 30612, 30614, 30620, 30622, 30626, 30628, 30630, 30632, 30634, 30644, 30646, 30648, 30656, 30658, 30660, 30664, 30670, 30672, 30673, 30674, 30676, 30677, 30690, 30710, 30720, 30730, 30740, 30750, 30760, 30990, 30995, 31000, 31100, 31150, 31200, 31250, 31300, 31350, 31400, 31450, 31500, 31550, 31600, 31650, 31700, 31750, 31800, 31900, 31950],
        areas: ['Ipoh Old Town', 'Ipoh Garden', 'Bercham', 'Falim', 'Tambun']
      },
      {
        name: 'Taiping',
        postcodes: [34000, 34100, 34200, 34300, 34400, 34500, 34600, 34700, 34800, 34850, 34900, 34950],
        areas: ['Taiping Town', 'Kamunting']
      }
    ]
  },

  // Sabah
  {
    start: 87000,
    end: 91999,
    state: 'SBH',
    stateName: 'Sabah',
    cities: [
      {
        name: 'Kota Kinabalu',
        postcodes: [88000, 88100, 88200, 88300, 88400, 88450, 88500, 88503, 88504, 88505, 88506, 88508, 88512, 88517, 88518, 88538, 88540, 88550, 88551, 88558, 88560, 88564, 88566, 88570, 88572, 88576, 88582, 88586, 88590, 88592, 88594, 88596, 88604, 88606, 88608, 88609, 88612, 88614, 88622, 88624, 88626, 88628, 88630, 88632, 88634, 88646, 88648, 88650, 88660, 88661, 88662, 88672, 88673, 88675, 88690, 88692, 88710, 88720, 88730, 88740, 88750, 88760, 88770, 88780, 88790, 88800, 88810, 88820, 88830, 88840, 88850, 88860, 88870, 88880, 88890, 88900, 88990, 88995],
        areas: ['KK City Centre', 'Likas', 'Penampang', 'Putatan', 'Inanam']
      },
      {
        name: 'Sandakan',
        postcodes: [90000, 90100, 90200, 90300, 90700, 90701, 90702, 90703, 90704, 90705, 90706, 90707, 90708, 90709, 90710, 90711, 90712, 90713, 90714, 90715, 90716, 90717, 90718, 90719, 90720, 90721, 90722, 90723, 90724, 90725, 90726, 90727, 90728, 90729, 90730, 90731, 90732, 90733, 90734, 90735, 90736, 90737, 90738, 90739, 90740, 90741, 90742, 90743, 90744, 90745, 90746, 90747, 90748, 90749, 90750, 90751, 90752, 90753, 90754, 90755, 90756, 90757, 90758, 90759, 90760, 90990, 90995],
        areas: ['Sandakan Town', 'Batu Sapi']
      }
    ]
  },

  // Sarawak
  {
    start: 93000,
    end: 98999,
    state: 'SWK',
    stateName: 'Sarawak',
    cities: [
      {
        name: 'Kuching',
        postcodes: [93000, 93050, 93100, 93150, 93200, 93250, 93300, 93350, 93400, 93450, 93500, 93503, 93505, 93507, 93508, 93512, 93514, 93517, 93518, 93529, 93532, 93540, 93542, 93546, 93550, 93551, 93558, 93564, 93566, 93570, 93572, 93576, 93582, 93586, 93590, 93594, 93596, 93608, 93609, 93614, 93620, 93622, 93626, 93628, 93632, 93634, 93648, 93650, 93658, 93660, 93661, 93662, 93664, 93672, 93673, 93675, 93990, 93995, 94000, 94100, 94200, 94300, 94400, 94500, 94600, 94700, 94800, 94850, 94900, 94950],
        areas: ['Kuching City', 'Petra Jaya', 'Samarahan', 'Kota Samarahan']
      },
      {
        name: 'Miri',
        postcodes: [98000, 98007, 98008, 98009, 98050, 98100, 98200, 98300, 98700, 98701, 98702, 98703, 98704, 98705, 98706, 98707, 98708, 98709, 98710, 98711, 98712, 98713, 98714, 98715, 98716, 98717, 98718, 98719, 98720, 98721, 98722, 98723, 98724, 98725, 98726, 98727, 98728, 98729, 98730, 98731, 98732, 98733, 98734, 98735, 98736, 98737, 98738, 98739, 98740, 98741, 98742, 98743, 98744, 98745, 98746, 98747, 98748, 98749, 98750, 98751, 98752, 98753, 98754, 98755, 98756, 98757, 98758, 98759, 98760, 98990, 98995],
        areas: ['Miri City', 'Lutong', 'Tudan']
      }
    ]
  }

  // Add more states as needed...
];

export class MalaysianPostcodeService {
  private static instance: MalaysianPostcodeService;

  public static getInstance(): MalaysianPostcodeService {
    if (!this.instance) {
      this.instance = new MalaysianPostcodeService();
    }
    return this.instance;
  }

  /**
   * Get location data by postcode
   */
  getLocationByPostcode(postcode: string): LocationData | null {
    const code = parseInt(postcode);
    if (isNaN(code) || postcode.length !== 5) {
      return null;
    }

    for (const range of MALAYSIAN_POSTCODE_DATABASE) {
      if (code >= range.start && code <= range.end) {
        // Find specific city if available
        const city = this.findCityByPostcode(range, code);
        
        return {
          state: range.state,
          stateCode: range.state,
          stateName: range.stateName,
          city: city?.name || range.cities[0]?.name || range.stateName,
          area: city?.areas?.[0],
          zone: this.getZone(range.state)
        };
      }
    }

    return null;
  }

  /**
   * Validate postcode format and location
   */
  validatePostcode(postcode: string): {
    valid: boolean;
    formatted?: string;
    location?: LocationData;
    error?: string;
  } {
    // Remove spaces and validate format
    const cleaned = postcode.replace(/\s/g, '');
    
    if (!/^\d{5}$/.test(cleaned)) {
      return {
        valid: false,
        error: 'Postcode must be 5 digits'
      };
    }

    const location = this.getLocationByPostcode(cleaned);
    
    if (!location) {
      return {
        valid: false,
        formatted: cleaned,
        error: 'Invalid Malaysian postcode'
      };
    }

    return {
      valid: true,
      formatted: cleaned,
      location
    };
  }

  /**
   * Get all cities for a specific state
   */
  getCitiesByState(state: MalaysianState): string[] {
    const range = MALAYSIAN_POSTCODE_DATABASE.find(r => r.state === state);
    return range ? range.cities.map(c => c.name) : [];
  }

  /**
   * Get all postcodes for a specific city
   */
  getPostcodesByCity(city: string): number[] {
    for (const range of MALAYSIAN_POSTCODE_DATABASE) {
      const cityData = range.cities.find(c => 
        c.name.toLowerCase() === city.toLowerCase()
      );
      if (cityData) {
        return cityData.postcodes;
      }
    }
    return [];
  }

  /**
   * Search locations by partial text
   */
  searchLocations(query: string): LocationData[] {
    const results: LocationData[] = [];
    const lowerQuery = query.toLowerCase();

    for (const range of MALAYSIAN_POSTCODE_DATABASE) {
      // Search in state name
      if (range.stateName.toLowerCase().includes(lowerQuery)) {
        results.push({
          state: range.state,
          stateCode: range.state,
          stateName: range.stateName,
          city: range.cities[0]?.name || range.stateName,
          zone: this.getZone(range.state)
        });
      }

      // Search in cities
      for (const city of range.cities) {
        if (city.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            state: range.state,
            stateCode: range.state,
            stateName: range.stateName,
            city: city.name,
            area: city.areas?.[0],
            zone: this.getZone(range.state)
          });
        }

        // Search in areas
        if (city.areas) {
          for (const area of city.areas) {
            if (area.toLowerCase().includes(lowerQuery)) {
              results.push({
                state: range.state,
                stateCode: range.state,
                stateName: range.stateName,
                city: city.name,
                area: area,
                zone: this.getZone(range.state)
              });
            }
          }
        }
      }
    }

    return results.slice(0, 10); // Limit results
  }

  private findCityByPostcode(range: PostcodeRange, postcode: number): PostcodeRange['cities'][0] | null {
    for (const city of range.cities) {
      if (city.postcodes.includes(postcode)) {
        return city;
      }
    }
    
    // If exact postcode not found, return the first city in the range
    return range.cities[0] || null;
  }

  private getZone(state: MalaysianState): 'west' | 'east' {
    const eastMalaysiaStates: MalaysianState[] = ['SBH', 'SWK', 'LBN'];
    return eastMalaysiaStates.includes(state) ? 'east' : 'west';
  }

  /**
   * Format postcode with proper spacing
   */
  formatPostcode(postcode: string): string {
    const cleaned = postcode.replace(/\s/g, '');
    if (cleaned.length === 5) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    }
    return cleaned;
  }

  /**
   * Get state name by code
   */
  getStateNameByCode(stateCode: MalaysianState): string {
    const range = MALAYSIAN_POSTCODE_DATABASE.find(r => r.state === stateCode);
    return range?.stateName || stateCode;
  }

  /**
   * Get all states
   */
  getAllStates(): Array<{ code: MalaysianState; name: string; zone: 'west' | 'east' }> {
    return MALAYSIAN_POSTCODE_DATABASE.map(range => ({
      code: range.state,
      name: range.stateName,
      zone: this.getZone(range.state)
    }));
  }
}

// Export singleton instance
export const malaysianPostcodeService = MalaysianPostcodeService.getInstance();
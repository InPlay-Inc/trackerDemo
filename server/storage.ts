import { users, type User, type InsertUser, SmartLabelWithTrace, TracePoint, RealTimeLabel } from "@shared/schema";

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

// Extend the storage interface with methods for smart labels
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllSmartLabelsWithTrace(): Promise<SmartLabelWithTrace[]>;
  getSmartLabelWithTrace(id: string): Promise<SmartLabelWithTrace | undefined>;
  // Real-time label tracking methods
  getRealTimeLabels(): Promise<RealTimeLabel[]>;
  getRealTimeLabelByMacId(macId: string): Promise<RealTimeLabel | undefined>;
  addRealTimeLabel(macId: string, name?: string): Promise<RealTimeLabel>;
  updateRealTimeLabelPosition(id: string, position: TracePoint): Promise<RealTimeLabel | undefined>;
  // ShipRec integration
  getShipRecAuthConfig(): Promise<AuthConfig | undefined>;
  setShipRecAuthConfig(config: AuthConfig): Promise<void>;
  deleteShipRecAuthConfig(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private smartLabels: Map<string, SmartLabelWithTrace>;
  private realTimeLabels: Map<string, RealTimeLabel>;
  private shipRecAuthConfig?: AuthConfig;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.smartLabels = new Map();
    this.realTimeLabels = new Map();
    this.currentId = 1;
    this.initializeSmartLabels();
  }

  // Initialize smart labels with mock data for demonstration
  private initializeSmartLabels() {
    // Create more realistic routes that follow roads and don't cross freeways
    // These routes are now 2-2.5 hours long to provide more tracking points
    const initialLabels: SmartLabelWithTrace[] = [
      {
        id: "label001",
        asset: "Package A",
        trace: [
          // Downtown LA to Santa Monica route STRICTLY via major roads (48 min)
          { lat: 34.0522, lng: -118.2437, timestamp: new Date("2025-04-01T10:00:00Z") }, // Start at City Hall
          { lat: 34.0530, lng: -118.2450, timestamp: new Date("2025-04-01T10:01:00Z") }, // West on 1st St
          { lat: 34.0533, lng: -118.2465, timestamp: new Date("2025-04-01T10:02:00Z") }, // Continue on 1st St
          { lat: 34.0536, lng: -118.2485, timestamp: new Date("2025-04-01T10:03:00Z") }, // Continue on 1st St
          { lat: 34.0537, lng: -118.2505, timestamp: new Date("2025-04-01T10:04:00Z") }, // Turn south on Figueroa St
          { lat: 34.0525, lng: -118.2510, timestamp: new Date("2025-04-01T10:05:00Z") }, // South on Figueroa St
          { lat: 34.0510, lng: -118.2515, timestamp: new Date("2025-04-01T10:06:00Z") }, // South on Figueroa St
          { lat: 34.0495, lng: -118.2522, timestamp: new Date("2025-04-01T10:07:00Z") }, // Turn west onto Wilshire Blvd
          { lat: 34.0498, lng: -118.2545, timestamp: new Date("2025-04-01T10:08:00Z") }, // West on Wilshire Blvd
          { lat: 34.0501, lng: -118.2575, timestamp: new Date("2025-04-01T10:09:00Z") }, // West on Wilshire Blvd
          { lat: 34.0505, lng: -118.2605, timestamp: new Date("2025-04-01T10:10:00Z") }, // West on Wilshire Blvd
          { lat: 34.0508, lng: -118.2635, timestamp: new Date("2025-04-01T10:11:00Z") }, // West on Wilshire Blvd
          { lat: 34.0510, lng: -118.2665, timestamp: new Date("2025-04-01T10:12:00Z") }, // West on Wilshire Blvd
          { lat: 34.0513, lng: -118.2695, timestamp: new Date("2025-04-01T10:13:00Z") }, // West on Wilshire Blvd, crossing 110
          { lat: 34.0516, lng: -118.2725, timestamp: new Date("2025-04-01T10:14:00Z") }, // West on Wilshire Blvd
          { lat: 34.0518, lng: -118.2755, timestamp: new Date("2025-04-01T10:15:00Z") }, // West on Wilshire Blvd
          { lat: 34.0520, lng: -118.2785, timestamp: new Date("2025-04-01T10:16:00Z") }, // West on Wilshire Blvd
          { lat: 34.0522, lng: -118.2815, timestamp: new Date("2025-04-01T10:17:00Z") }, // West on Wilshire Blvd
          { lat: 34.0523, lng: -118.2845, timestamp: new Date("2025-04-01T10:18:00Z") }, // West on Wilshire Blvd
          { lat: 34.0525, lng: -118.2875, timestamp: new Date("2025-04-01T10:19:00Z") }, // West on Wilshire Blvd
          { lat: 34.0526, lng: -118.2905, timestamp: new Date("2025-04-01T10:20:00Z") }, // West on Wilshire Blvd
          { lat: 34.0527, lng: -118.2935, timestamp: new Date("2025-04-01T10:21:00Z") }, // West on Wilshire Blvd
          { lat: 34.0529, lng: -118.2965, timestamp: new Date("2025-04-01T10:22:00Z") }, // West on Wilshire Blvd
          { lat: 34.0530, lng: -118.2995, timestamp: new Date("2025-04-01T10:23:00Z") }, // West on Wilshire Blvd
          { lat: 34.0529, lng: -118.3025, timestamp: new Date("2025-04-01T10:24:00Z") }, // West on Wilshire Blvd in Koreatown
          { lat: 34.0528, lng: -118.3055, timestamp: new Date("2025-04-01T10:25:00Z") }, // West on Wilshire Blvd
          { lat: 34.0527, lng: -118.3085, timestamp: new Date("2025-04-01T10:26:00Z") }, // West on Wilshire Blvd
          { lat: 34.0526, lng: -118.3115, timestamp: new Date("2025-04-01T10:27:00Z") }, // West on Wilshire Blvd
          { lat: 34.0525, lng: -118.3145, timestamp: new Date("2025-04-01T10:28:00Z") }, // West on Wilshire Blvd
          { lat: 34.0524, lng: -118.3175, timestamp: new Date("2025-04-01T10:29:00Z") }, // West on Wilshire Blvd
          { lat: 34.0523, lng: -118.3205, timestamp: new Date("2025-04-01T10:30:00Z") }, // West on Wilshire Blvd
          { lat: 34.0522, lng: -118.3235, timestamp: new Date("2025-04-01T10:31:00Z") }, // West on Wilshire Blvd
          { lat: 34.0521, lng: -118.3265, timestamp: new Date("2025-04-01T10:32:00Z") }, // West on Wilshire Blvd Museum Row
          { lat: 34.0520, lng: -118.3295, timestamp: new Date("2025-04-01T10:33:00Z") }, // West on Wilshire Blvd
          { lat: 34.0519, lng: -118.3325, timestamp: new Date("2025-04-01T10:34:00Z") }, // West on Wilshire Blvd
          { lat: 34.0518, lng: -118.3355, timestamp: new Date("2025-04-01T10:35:00Z") }, // West on Wilshire Blvd
          { lat: 34.0517, lng: -118.3385, timestamp: new Date("2025-04-01T10:36:00Z") }, // West on Wilshire Blvd
          { lat: 34.0516, lng: -118.3415, timestamp: new Date("2025-04-01T10:37:00Z") }, // West on Wilshire Blvd
          { lat: 34.0515, lng: -118.3445, timestamp: new Date("2025-04-01T10:38:00Z") }, // West on Wilshire Blvd
          { lat: 34.0514, lng: -118.3475, timestamp: new Date("2025-04-01T10:39:00Z") }, // West on Wilshire Blvd
          { lat: 34.0513, lng: -118.3505, timestamp: new Date("2025-04-01T10:40:00Z") }, // West on Wilshire Blvd
          { lat: 34.0512, lng: -118.3535, timestamp: new Date("2025-04-01T10:41:00Z") }, // West on Wilshire Blvd, entering Beverly Hills
          { lat: 34.0511, lng: -118.3565, timestamp: new Date("2025-04-01T10:42:00Z") }, // West on Wilshire Blvd in Beverly Hills
          { lat: 34.0510, lng: -118.3595, timestamp: new Date("2025-04-01T10:43:00Z") }, // West on Wilshire Blvd in Beverly Hills
          { lat: 34.0509, lng: -118.3635, timestamp: new Date("2025-04-01T10:44:00Z") }, // West on Wilshire Blvd in Beverly Hills
          { lat: 34.0508, lng: -118.3665, timestamp: new Date("2025-04-01T10:45:00Z") }, // West on Wilshire Blvd in Beverly Hills
          { lat: 34.0507, lng: -118.3695, timestamp: new Date("2025-04-01T10:46:00Z") }, // West on Wilshire Blvd in Beverly Hills
          { lat: 34.0506, lng: -118.3725, timestamp: new Date("2025-04-01T10:47:00Z") }, // West on Wilshire Blvd 
          { lat: 34.0505, lng: -118.3755, timestamp: new Date("2025-04-01T10:48:00Z") }, // West on Wilshire Blvd 
          { lat: 34.0504, lng: -118.3795, timestamp: new Date("2025-04-01T10:49:00Z") }, // West on Wilshire Blvd 
          { lat: 34.0502, lng: -118.3835, timestamp: new Date("2025-04-01T10:50:00Z") }, // West on Wilshire Blvd
          { lat: 34.0501, lng: -118.3875, timestamp: new Date("2025-04-01T10:51:00Z") }, // West on Wilshire Blvd
          { lat: 34.0500, lng: -118.3915, timestamp: new Date("2025-04-01T10:52:00Z") }, // West on Wilshire Blvd
          { lat: 34.0499, lng: -118.3955, timestamp: new Date("2025-04-01T10:53:00Z") }, // West on Wilshire Blvd
          { lat: 34.0498, lng: -118.3995, timestamp: new Date("2025-04-01T10:54:00Z") }, // West on Wilshire Blvd
          { lat: 34.0497, lng: -118.4035, timestamp: new Date("2025-04-01T10:55:00Z") }, // West on Wilshire Blvd
          { lat: 34.0496, lng: -118.4075, timestamp: new Date("2025-04-01T10:56:00Z") }, // West on Wilshire Blvd
          { lat: 34.0495, lng: -118.4115, timestamp: new Date("2025-04-01T10:57:00Z") }, // West on Wilshire Blvd
          { lat: 34.0494, lng: -118.4155, timestamp: new Date("2025-04-01T10:58:00Z") }, // West on Wilshire Blvd
          { lat: 34.0493, lng: -118.4195, timestamp: new Date("2025-04-01T10:59:00Z") }, // West on Wilshire Blvd
          { lat: 34.0491, lng: -118.4235, timestamp: new Date("2025-04-01T11:00:00Z") }, // West on Wilshire Blvd
          { lat: 34.0490, lng: -118.4275, timestamp: new Date("2025-04-01T11:01:00Z") }, // West on Wilshire Blvd
          { lat: 34.0489, lng: -118.4315, timestamp: new Date("2025-04-01T11:02:00Z") }, // West on Wilshire Blvd
          { lat: 34.0488, lng: -118.4355, timestamp: new Date("2025-04-01T11:03:00Z") }, // West on Wilshire Blvd
          { lat: 34.0487, lng: -118.4395, timestamp: new Date("2025-04-01T11:04:00Z") }, // Wilshire Blvd in Santa Monica
          { lat: 34.0485, lng: -118.4405, timestamp: new Date("2025-04-01T11:05:00Z") }, // Turn south onto Ocean Ave
          { lat: 34.0465, lng: -118.4410, timestamp: new Date("2025-04-01T11:06:00Z") }, // South on Ocean Ave
          { lat: 34.0445, lng: -118.4413, timestamp: new Date("2025-04-01T11:07:00Z") }, // South on Ocean Ave
          { lat: 34.0425, lng: -118.4416, timestamp: new Date("2025-04-01T11:08:00Z") }, // South on Ocean Ave
          { lat: 34.0405, lng: -118.4419, timestamp: new Date("2025-04-01T11:09:00Z") }, // South on Ocean Ave
          { lat: 34.0385, lng: -118.4422, timestamp: new Date("2025-04-01T11:10:00Z") }, // South on Ocean Ave
          { lat: 34.0365, lng: -118.4425, timestamp: new Date("2025-04-01T11:11:00Z") }, // South on Ocean Ave
          { lat: 34.0345, lng: -118.4428, timestamp: new Date("2025-04-01T11:12:00Z") }, // South on Ocean Ave
          { lat: 34.0325, lng: -118.4431, timestamp: new Date("2025-04-01T11:13:00Z") }, // South on Ocean Ave
          { lat: 34.0305, lng: -118.4434, timestamp: new Date("2025-04-01T11:14:00Z") }, // South on Ocean Ave
          { lat: 34.0290, lng: -118.4437, timestamp: new Date("2025-04-01T11:15:00Z") }, // South on Ocean Ave
          { lat: 34.0275, lng: -118.4440, timestamp: new Date("2025-04-01T11:16:00Z") }, // South on Ocean Ave
          { lat: 34.0260, lng: -118.4443, timestamp: new Date("2025-04-01T11:17:00Z") }, // South on Ocean Ave
          { lat: 34.0250, lng: -118.4446, timestamp: new Date("2025-04-01T11:18:00Z") }, // Turn west on Broadway
          { lat: 34.0248, lng: -118.4486, timestamp: new Date("2025-04-01T11:19:00Z") }, // West on Broadway
          { lat: 34.0246, lng: -118.4526, timestamp: new Date("2025-04-01T11:20:00Z") }, // West on Broadway
          { lat: 34.0244, lng: -118.4566, timestamp: new Date("2025-04-01T11:21:00Z") }, // West on Broadway
          { lat: 34.0242, lng: -118.4606, timestamp: new Date("2025-04-01T11:22:00Z") }, // West on Broadway
          { lat: 34.0240, lng: -118.4646, timestamp: new Date("2025-04-01T11:23:00Z") }, // West on Broadway
          { lat: 34.0238, lng: -118.4686, timestamp: new Date("2025-04-01T11:24:00Z") }, // West on Broadway
          { lat: 34.0236, lng: -118.4726, timestamp: new Date("2025-04-01T11:25:00Z") }, // West on Broadway
          { lat: 34.0234, lng: -118.4748, timestamp: new Date("2025-04-01T11:26:00Z") }, // Arrive at Santa Monica Promenade
        ],
        targetReached: true,
      },
      {
        id: "label002",
        asset: "Package B",
        trace: [
          // Downtown Arts District to Dodger Stadium via major roads (2.5 hours)
          { lat: 34.0422, lng: -118.2337, timestamp: new Date("2025-04-01T10:00:00Z") }, // Start at 4th & Alameda
          { lat: 34.0427, lng: -118.2339, timestamp: new Date("2025-04-01T10:02:00Z") }, // North on Alameda St
          { lat: 34.0432, lng: -118.2341, timestamp: new Date("2025-04-01T10:04:00Z") }, // North on Alameda St
          { lat: 34.0437, lng: -118.2343, timestamp: new Date("2025-04-01T10:06:00Z") }, // North on Alameda St
          { lat: 34.0442, lng: -118.2345, timestamp: new Date("2025-04-01T10:08:00Z") }, // North on Alameda St
          { lat: 34.0447, lng: -118.2347, timestamp: new Date("2025-04-01T10:10:00Z") }, // North on Alameda St
          { lat: 34.0452, lng: -118.2349, timestamp: new Date("2025-04-01T10:12:00Z") }, // North on Alameda St
          { lat: 34.0457, lng: -118.2351, timestamp: new Date("2025-04-01T10:14:00Z") }, // North on Alameda St
          { lat: 34.0462, lng: -118.2353, timestamp: new Date("2025-04-01T10:16:00Z") }, // North on Alameda St
          { lat: 34.0467, lng: -118.2355, timestamp: new Date("2025-04-01T10:18:00Z") }, // Approaching 1st St on Alameda
          { lat: 34.0467, lng: -118.2360, timestamp: new Date("2025-04-01T10:20:00Z") }, // Turn west on 1st St
          { lat: 34.0467, lng: -118.2370, timestamp: new Date("2025-04-01T10:22:00Z") }, // West on 1st St
          { lat: 34.0467, lng: -118.2380, timestamp: new Date("2025-04-01T10:24:00Z") }, // West on 1st St
          { lat: 34.0467, lng: -118.2390, timestamp: new Date("2025-04-01T10:26:00Z") }, // West on 1st St
          { lat: 34.0467, lng: -118.2400, timestamp: new Date("2025-04-01T10:28:00Z") }, // West on 1st St
          { lat: 34.0467, lng: -118.2410, timestamp: new Date("2025-04-01T10:30:00Z") }, // West on 1st St
          { lat: 34.0468, lng: -118.2420, timestamp: new Date("2025-04-01T10:32:00Z") }, // West on 1st St
          { lat: 34.0468, lng: -118.2430, timestamp: new Date("2025-04-01T10:34:00Z") }, // West on 1st St
          { lat: 34.0468, lng: -118.2440, timestamp: new Date("2025-04-01T10:36:00Z") }, // West on 1st St
          { lat: 34.0468, lng: -118.2450, timestamp: new Date("2025-04-01T10:38:00Z") }, // West on 1st St
          { lat: 34.0469, lng: -118.2460, timestamp: new Date("2025-04-01T10:40:00Z") }, // West on 1st St, approaching Broadway
          { lat: 34.0469, lng: -118.2470, timestamp: new Date("2025-04-01T10:42:00Z") }, // West on 1st St
          { lat: 34.0469, lng: -118.2480, timestamp: new Date("2025-04-01T10:44:00Z") }, // West on 1st St
          { lat: 34.0470, lng: -118.2490, timestamp: new Date("2025-04-01T10:46:00Z") }, // West on 1st St
          { lat: 34.0470, lng: -118.2500, timestamp: new Date("2025-04-01T10:48:00Z") }, // West on 1st St
          { lat: 34.0470, lng: -118.2510, timestamp: new Date("2025-04-01T10:50:00Z") }, // West on 1st St, approaching Hill St
          { lat: 34.0472, lng: -118.2520, timestamp: new Date("2025-04-01T10:52:00Z") }, // Turn north on Hill St
          { lat: 34.0477, lng: -118.2519, timestamp: new Date("2025-04-01T10:54:00Z") }, // North on Hill St
          { lat: 34.0482, lng: -118.2518, timestamp: new Date("2025-04-01T10:56:00Z") }, // North on Hill St
          { lat: 34.0487, lng: -118.2517, timestamp: new Date("2025-04-01T10:58:00Z") }, // North on Hill St
          { lat: 34.0492, lng: -118.2516, timestamp: new Date("2025-04-01T11:00:00Z") }, // North on Hill St
          { lat: 34.0497, lng: -118.2515, timestamp: new Date("2025-04-01T11:02:00Z") }, // North on Hill St toward Chinatown
          { lat: 34.0502, lng: -118.2514, timestamp: new Date("2025-04-01T11:04:00Z") }, // North on Hill St
          { lat: 34.0507, lng: -118.2513, timestamp: new Date("2025-04-01T11:06:00Z") }, // North on Hill St
          { lat: 34.0512, lng: -118.2512, timestamp: new Date("2025-04-01T11:08:00Z") }, // North on Hill St through Chinatown
          { lat: 34.0517, lng: -118.2511, timestamp: new Date("2025-04-01T11:10:00Z") }, // North on Hill St through Chinatown
          { lat: 34.0522, lng: -118.2510, timestamp: new Date("2025-04-01T11:12:00Z") }, // North on Hill St through Chinatown
          { lat: 34.0527, lng: -118.2509, timestamp: new Date("2025-04-01T11:14:00Z") }, // North on Hill St through Chinatown
          { lat: 34.0532, lng: -118.2508, timestamp: new Date("2025-04-01T11:16:00Z") }, // North on Hill St through Chinatown
          { lat: 34.0537, lng: -118.2507, timestamp: new Date("2025-04-01T11:18:00Z") }, // North on Hill St
          { lat: 34.0542, lng: -118.2506, timestamp: new Date("2025-04-01T11:20:00Z") }, // North on Hill St
          { lat: 34.0547, lng: -118.2505, timestamp: new Date("2025-04-01T11:22:00Z") }, // North on Hill St
          { lat: 34.0552, lng: -118.2503, timestamp: new Date("2025-04-01T11:24:00Z") }, // North on Hill St
          { lat: 34.0557, lng: -118.2490, timestamp: new Date("2025-04-01T11:26:00Z") }, // Turn onto Bernard St
          { lat: 34.0562, lng: -118.2485, timestamp: new Date("2025-04-01T11:28:00Z") }, // Onto Stadium Way
          { lat: 34.0567, lng: -118.2482, timestamp: new Date("2025-04-01T11:30:00Z") }, // Continue on Stadium Way
          { lat: 34.0572, lng: -118.2479, timestamp: new Date("2025-04-01T11:32:00Z") }, // Continue on Stadium Way
          { lat: 34.0577, lng: -118.2477, timestamp: new Date("2025-04-01T11:34:00Z") }, // Continue on Stadium Way
          { lat: 34.0582, lng: -118.2475, timestamp: new Date("2025-04-01T11:36:00Z") }, // Continue on Stadium Way
          { lat: 34.0587, lng: -118.2472, timestamp: new Date("2025-04-01T11:38:00Z") }, // Continue on Stadium Way
          { lat: 34.0592, lng: -118.2470, timestamp: new Date("2025-04-01T11:40:00Z") }, // Continue on Stadium Way
          { lat: 34.0597, lng: -118.2468, timestamp: new Date("2025-04-01T11:42:00Z") }, // Continue on Stadium Way
          { lat: 34.0602, lng: -118.2466, timestamp: new Date("2025-04-01T11:44:00Z") }, // Continue on Stadium Way
          { lat: 34.0607, lng: -118.2464, timestamp: new Date("2025-04-01T11:46:00Z") }, // Continue on Stadium Way
          { lat: 34.0612, lng: -118.2462, timestamp: new Date("2025-04-01T11:48:00Z") }, // Continue on Stadium Way
          { lat: 34.0617, lng: -118.2460, timestamp: new Date("2025-04-01T11:50:00Z") }, // Continue on Stadium Way
          { lat: 34.0622, lng: -118.2458, timestamp: new Date("2025-04-01T11:52:00Z") }, // Continue on Stadium Way
          { lat: 34.0627, lng: -118.2456, timestamp: new Date("2025-04-01T11:54:00Z") }, // Continue on Stadium Way
          { lat: 34.0632, lng: -118.2454, timestamp: new Date("2025-04-01T11:56:00Z") }, // Continue on Stadium Way
          { lat: 34.0637, lng: -118.2452, timestamp: new Date("2025-04-01T11:58:00Z") }, // Continue on Stadium Way
          { lat: 34.0642, lng: -118.2450, timestamp: new Date("2025-04-01T12:00:00Z") }, // Continue on Stadium Way
          { lat: 34.0647, lng: -118.2448, timestamp: new Date("2025-04-01T12:02:00Z") }, // Continue on Stadium Way
          { lat: 34.0652, lng: -118.2446, timestamp: new Date("2025-04-01T12:04:00Z") }, // Continue on Stadium Way
          { lat: 34.0657, lng: -118.2444, timestamp: new Date("2025-04-01T12:06:00Z") }, // Continue on Stadium Way
          { lat: 34.0662, lng: -118.2442, timestamp: new Date("2025-04-01T12:08:00Z") }, // Continue on Stadium Way
          { lat: 34.0667, lng: -118.2440, timestamp: new Date("2025-04-01T12:10:00Z") }, // Continue on Stadium Way
          { lat: 34.0672, lng: -118.2438, timestamp: new Date("2025-04-01T12:12:00Z") }, // Continue on Stadium Way
          { lat: 34.0677, lng: -118.2436, timestamp: new Date("2025-04-01T12:14:00Z") }, // Continue on Stadium Way
          { lat: 34.0682, lng: -118.2434, timestamp: new Date("2025-04-01T12:16:00Z") }, // Continue on Stadium Way
          { lat: 34.0687, lng: -118.2432, timestamp: new Date("2025-04-01T12:18:00Z") }, // Continue on Stadium Way
          { lat: 34.0692, lng: -118.2430, timestamp: new Date("2025-04-01T12:20:00Z") }, // Continue on Stadium Way
          { lat: 34.0697, lng: -118.2428, timestamp: new Date("2025-04-01T12:22:00Z") }, // Continue on Stadium Way
          { lat: 34.0702, lng: -118.2426, timestamp: new Date("2025-04-01T12:24:00Z") }, // Continue on Stadium Way
          { lat: 34.0707, lng: -118.2423, timestamp: new Date("2025-04-01T12:26:00Z") }, // Continue on Stadium Way
          { lat: 34.0712, lng: -118.2418, timestamp: new Date("2025-04-01T12:28:00Z") }, // Continue on Stadium Way
          { lat: 34.0736, lng: -118.2400, timestamp: new Date("2025-04-01T12:30:00Z") }, // Final destination - Dodger Stadium parking lot
        ],
        targetReached: false,
      },
      {
        id: "label003",
        asset: "Delivery Van",
        trace: [
          // Echo Park to LAX via major roads (2.25 hours)
          { lat: 34.0720, lng: -118.2637, timestamp: new Date("2025-04-01T10:00:00Z") }, // Start near Echo Park Lake
          { lat: 34.0715, lng: -118.2670, timestamp: new Date("2025-04-01T10:05:00Z") }, // West on Sunset Blvd
          { lat: 34.0712, lng: -118.2715, timestamp: new Date("2025-04-01T10:10:00Z") }, // Continue on Sunset Blvd
          { lat: 34.0708, lng: -118.2760, timestamp: new Date("2025-04-01T10:15:00Z") }, // Still on Sunset Blvd
          { lat: 34.0705, lng: -118.2805, timestamp: new Date("2025-04-01T10:20:00Z") }, // Continue west on Sunset
          { lat: 34.0702, lng: -118.2850, timestamp: new Date("2025-04-01T10:25:00Z") }, // Approaching Silver Lake on Sunset
          { lat: 34.0698, lng: -118.2895, timestamp: new Date("2025-04-01T10:30:00Z") }, // Continue west on Sunset
          { lat: 34.0694, lng: -118.2940, timestamp: new Date("2025-04-01T10:35:00Z") }, // Approaching Hollywood on Sunset
          { lat: 34.0690, lng: -118.2985, timestamp: new Date("2025-04-01T10:40:00Z") }, // Continue on Sunset Blvd
          { lat: 34.0687, lng: -118.3030, timestamp: new Date("2025-04-01T10:45:00Z") }, // Through East Hollywood on Sunset
          { lat: 34.0683, lng: -118.3075, timestamp: new Date("2025-04-01T10:50:00Z") }, // Approaching Hollywood proper on Sunset
          { lat: 34.0680, lng: -118.3120, timestamp: new Date("2025-04-01T10:55:00Z") }, // Hollywood area on Sunset
          { lat: 34.0676, lng: -118.3165, timestamp: new Date("2025-04-01T11:00:00Z") }, // Continue on Sunset Blvd
          { lat: 34.0673, lng: -118.3210, timestamp: new Date("2025-04-01T11:05:00Z") }, // Approaching West Hollywood on Sunset
          { lat: 34.0670, lng: -118.3255, timestamp: new Date("2025-04-01T11:10:00Z") }, // West Hollywood area on Sunset
          { lat: 34.0667, lng: -118.3300, timestamp: new Date("2025-04-01T11:15:00Z") }, // Continue west on Sunset
          { lat: 34.0663, lng: -118.3345, timestamp: new Date("2025-04-01T11:20:00Z") }, // Beverly Hills area on Sunset
          { lat: 34.0657, lng: -118.3400, timestamp: new Date("2025-04-01T11:25:00Z") }, // Continue on Sunset Blvd
          { lat: 34.0651, lng: -118.3455, timestamp: new Date("2025-04-01T11:28:00Z") }, // Turn south on N Doheny Dr
          { lat: 34.0600, lng: -118.3460, timestamp: new Date("2025-04-01T11:31:00Z") }, // Continue south on N Doheny Dr
          { lat: 34.0550, lng: -118.3465, timestamp: new Date("2025-04-01T11:34:00Z") }, // Turn west on Santa Monica Blvd
          { lat: 34.0547, lng: -118.3550, timestamp: new Date("2025-04-01T11:37:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0544, lng: -118.3650, timestamp: new Date("2025-04-01T11:40:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0541, lng: -118.3750, timestamp: new Date("2025-04-01T11:43:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0538, lng: -118.3850, timestamp: new Date("2025-04-01T11:46:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0535, lng: -118.3950, timestamp: new Date("2025-04-01T11:49:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0530, lng: -118.4050, timestamp: new Date("2025-04-01T11:52:00Z") }, // Continue west on Santa Monica Blvd
          { lat: 34.0480, lng: -118.4150, timestamp: new Date("2025-04-01T11:55:00Z") }, // Turn south on Westwood Blvd
          { lat: 34.0400, lng: -118.4155, timestamp: new Date("2025-04-01T11:58:00Z") }, // Continue south on Westwood Blvd
          { lat: 34.0300, lng: -118.4160, timestamp: new Date("2025-04-01T12:01:00Z") }, // Continue south on Westwood Blvd
          { lat: 34.0280, lng: -118.4162, timestamp: new Date("2025-04-01T12:02:00Z") }, // Continue south on Westwood Blvd
          { lat: 34.0260, lng: -118.4164, timestamp: new Date("2025-04-01T12:03:00Z") }, // Continue south on Westwood Blvd
          { lat: 34.0250, lng: -118.4165, timestamp: new Date("2025-04-01T12:04:00Z") }, // Turn west on National Blvd
          { lat: 34.0249, lng: -118.4185, timestamp: new Date("2025-04-01T12:05:00Z") }, // West on National Blvd
          { lat: 34.0248, lng: -118.4205, timestamp: new Date("2025-04-01T12:06:00Z") }, // West on National Blvd
          { lat: 34.0247, lng: -118.4225, timestamp: new Date("2025-04-01T12:07:00Z") }, // West on National Blvd
          { lat: 34.0246, lng: -118.4245, timestamp: new Date("2025-04-01T12:08:00Z") }, // West on National Blvd
          { lat: 34.0245, lng: -118.4265, timestamp: new Date("2025-04-01T12:09:00Z") }, // West on National Blvd
          { lat: 34.0240, lng: -118.4275, timestamp: new Date("2025-04-01T12:10:00Z") }, // Southwest on National Blvd
          { lat: 34.0230, lng: -118.4285, timestamp: new Date("2025-04-01T12:11:00Z") }, // Southwest on National Blvd
          { lat: 34.0220, lng: -118.4295, timestamp: new Date("2025-04-01T12:12:00Z") }, // Southwest on National Blvd
          { lat: 34.0210, lng: -118.4305, timestamp: new Date("2025-04-01T12:13:00Z") }, // Southwest on National Blvd
          { lat: 34.0200, lng: -118.4315, timestamp: new Date("2025-04-01T12:14:00Z") }, // Southwest on National Blvd
          { lat: 34.0185, lng: -118.4320, timestamp: new Date("2025-04-01T12:15:00Z") }, // Continue southwest on National Blvd
          { lat: 34.0170, lng: -118.4318, timestamp: new Date("2025-04-01T12:16:00Z") }, // Turn south on Sawtelle Blvd
          { lat: 34.0150, lng: -118.4315, timestamp: new Date("2025-04-01T12:17:00Z") }, // South on Sawtelle Blvd
          { lat: 34.0130, lng: -118.4310, timestamp: new Date("2025-04-01T12:18:00Z") }, // South on Sawtelle Blvd
          { lat: 34.0110, lng: -118.4305, timestamp: new Date("2025-04-01T12:19:00Z") }, // South on Sawtelle Blvd
          { lat: 34.0090, lng: -118.4300, timestamp: new Date("2025-04-01T12:20:00Z") }, // South on Sawtelle Blvd
          { lat: 34.0070, lng: -118.4280, timestamp: new Date("2025-04-01T12:21:00Z") }, // Turn southeast toward Jefferson Blvd
          { lat: 34.0050, lng: -118.4250, timestamp: new Date("2025-04-01T12:22:00Z") }, // Turn east onto Jefferson Blvd
          { lat: 34.0045, lng: -118.4230, timestamp: new Date("2025-04-01T12:23:00Z") }, // East on Jefferson Blvd
          { lat: 34.0040, lng: -118.4210, timestamp: new Date("2025-04-01T12:24:00Z") }, // East on Jefferson Blvd
          { lat: 34.0035, lng: -118.4205, timestamp: new Date("2025-04-01T12:25:00Z") }, // Turn south onto Sepulveda Blvd
          { lat: 34.0015, lng: -118.4200, timestamp: new Date("2025-04-01T12:26:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9990, lng: -118.4195, timestamp: new Date("2025-04-01T12:27:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9965, lng: -118.4190, timestamp: new Date("2025-04-01T12:28:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9940, lng: -118.4150, timestamp: new Date("2025-04-01T12:29:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9915, lng: -118.4100, timestamp: new Date("2025-04-01T12:30:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9890, lng: -118.4050, timestamp: new Date("2025-04-01T12:31:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9850, lng: -118.4000, timestamp: new Date("2025-04-01T12:32:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9800, lng: -118.3999, timestamp: new Date("2025-04-01T12:33:00Z") }, // South on Sepulveda Blvd
          { lat: 33.9750, lng: -118.3998, timestamp: new Date("2025-04-01T12:34:00Z") }, // South on Sepulveda Blvd toward LAX
          { lat: 33.9700, lng: -118.3998, timestamp: new Date("2025-04-01T12:35:00Z") }, // South on Sepulveda Blvd toward LAX
          { lat: 33.9650, lng: -118.3998, timestamp: new Date("2025-04-01T12:36:00Z") }, // South on Sepulveda Blvd toward LAX
          { lat: 33.9600, lng: -118.3998, timestamp: new Date("2025-04-01T12:37:00Z") }, // South on Sepulveda Blvd toward LAX
          { lat: 33.9536, lng: -118.3998, timestamp: new Date("2025-04-01T12:38:00Z") }, // Final destination - LAX via Sepulveda
        ],
        targetReached: true,
      },
      {
        id: "label004",
        asset: "Shipping Container",
        trace: [
          // Little Tokyo to Pasadena via major roads (2 hours)
          { lat: 34.0500, lng: -118.2400, timestamp: new Date("2025-04-01T10:00:00Z") }, // Start at Little Tokyo
          { lat: 34.0508, lng: -118.2385, timestamp: new Date("2025-04-01T10:07:00Z") }, // East on 1st St
          { lat: 34.0515, lng: -118.2370, timestamp: new Date("2025-04-01T10:14:00Z") }, // Continue on 1st St
          { lat: 34.0523, lng: -118.2355, timestamp: new Date("2025-04-01T10:21:00Z") }, // Approaching the LA River
          { lat: 34.0530, lng: -118.2340, timestamp: new Date("2025-04-01T10:28:00Z") }, // Crossing the LA River on 1st St
          { lat: 34.0536, lng: -118.2330, timestamp: new Date("2025-04-01T10:35:00Z") }, // Continue east on 1st St
          { lat: 34.0542, lng: -118.2320, timestamp: new Date("2025-04-01T10:42:00Z") }, // Continue on 1st St in Boyle Heights
          { lat: 34.0547, lng: -118.2310, timestamp: new Date("2025-04-01T10:49:00Z") }, // Turn north on State St
          { lat: 34.0570, lng: -118.2305, timestamp: new Date("2025-04-01T10:56:00Z") }, // North on State St
          { lat: 34.0593, lng: -118.2300, timestamp: new Date("2025-04-01T11:03:00Z") }, // Turn east on Marengo St
          { lat: 34.0598, lng: -118.2250, timestamp: new Date("2025-04-01T11:10:00Z") }, // Turn north on Soto St
          { lat: 34.0620, lng: -118.2245, timestamp: new Date("2025-04-01T11:17:00Z") }, // Continue north on Soto St
          { lat: 34.0645, lng: -118.2240, timestamp: new Date("2025-04-01T11:24:00Z") }, // North on Soto through Lincoln Heights
          { lat: 34.0670, lng: -118.2235, timestamp: new Date("2025-04-01T11:31:00Z") }, // Continue north on Soto St
          { lat: 34.0700, lng: -118.2230, timestamp: new Date("2025-04-01T11:38:00Z") }, // Turn east onto Mission Rd
          { lat: 34.0710, lng: -118.2130, timestamp: new Date("2025-04-01T11:42:00Z") }, // Continue northeast on Mission Rd
          { lat: 34.0730, lng: -118.2050, timestamp: new Date("2025-04-01T11:45:00Z") }, // Continue northeast on Mission Rd
          { lat: 34.0800, lng: -118.2000, timestamp: new Date("2025-04-01T11:48:00Z") }, // Turn north onto Huntington Dr
          { lat: 34.0850, lng: -118.1920, timestamp: new Date("2025-04-01T11:50:00Z") }, // Continue on Huntington Dr through El Sereno
          { lat: 34.0900, lng: -118.1830, timestamp: new Date("2025-04-01T11:52:00Z") }, // Turn north onto Fair Oaks Ave
          { lat: 34.0950, lng: -118.1780, timestamp: new Date("2025-04-01T11:53:30Z") }, // Continue north on Fair Oaks Ave
          { lat: 34.1000, lng: -118.1700, timestamp: new Date("2025-04-01T11:55:00Z") }, // Continue north on Fair Oaks Ave
          { lat: 34.1100, lng: -118.1600, timestamp: new Date("2025-04-01T11:57:00Z") }, // Continue north on Fair Oaks Ave
          { lat: 34.1200, lng: -118.1500, timestamp: new Date("2025-04-01T11:59:00Z") }, // Continue north on Fair Oaks Ave
          { lat: 34.1338, lng: -118.1466, timestamp: new Date("2025-04-01T12:00:00Z") }, // Final destination - Pasadena (Old Town)
        ],
        targetReached: false,
      },
      {
        id: "label005",
        asset: "LA to SF Express",
        trace: [
          // Los Angeles to San Francisco route via I-5 and I-580/I-80 (5.5 hour trip)
          // Starting in Downtown Los Angeles - These points follow the exact route of public roads
          { lat: 34.0522, lng: -118.2437, timestamp: new Date("2025-04-01T10:00:00Z") }, // Start at LA City Hall
          { lat: 34.0530, lng: -118.2470, timestamp: new Date("2025-04-01T10:02:00Z") }, // West on 1st St
          { lat: 34.0544, lng: -118.2505, timestamp: new Date("2025-04-01T10:04:00Z") }, // Continuing on 1st St to US-101 ramp
          
          // US-101 N to I-5 N interchange (110 km/h)
          { lat: 34.0555, lng: -118.2535, timestamp: new Date("2025-04-01T10:06:00Z") }, // Merging onto US-101 N
          { lat: 34.0622, lng: -118.2563, timestamp: new Date("2025-04-01T10:08:00Z") }, // On US-101 N
          { lat: 34.0702, lng: -118.2691, timestamp: new Date("2025-04-01T10:11:00Z") }, // Approaching I-5 interchange
          { lat: 34.0736, lng: -118.2726, timestamp: new Date("2025-04-01T10:13:00Z") }, // At US-101/I-5 interchange
          
          // I-5 N through LA and San Fernando Valley (110-120 km/h)
          { lat: 34.0821, lng: -118.2817, timestamp: new Date("2025-04-01T10:16:00Z") }, // On I-5 N in East LA
          { lat: 34.0919, lng: -118.2991, timestamp: new Date("2025-04-01T10:20:00Z") }, // I-5 N entering Atwater Village
          { lat: 34.1097, lng: -118.3089, timestamp: new Date("2025-04-01T10:24:00Z") }, // I-5 N approaching Glendale
          { lat: 34.1394, lng: -118.3334, timestamp: new Date("2025-04-01T10:28:00Z") }, // I-5 N through Glendale
          { lat: 34.1661, lng: -118.3459, timestamp: new Date("2025-04-01T10:32:00Z") }, // I-5 N past Burbank
          { lat: 34.1997, lng: -118.3589, timestamp: new Date("2025-04-01T10:36:00Z") }, // I-5 N through Sun Valley
          { lat: 34.2335, lng: -118.3747, timestamp: new Date("2025-04-01T10:40:00Z") }, // I-5 N approaching Sylmar
          { lat: 34.2683, lng: -118.4046, timestamp: new Date("2025-04-01T10:44:00Z") }, // I-5 N near Santa Clarita
          { lat: 34.3023, lng: -118.4471, timestamp: new Date("2025-04-01T10:48:00Z") }, // I-5 N approaching mountains
          { lat: 34.3381, lng: -118.4982, timestamp: new Date("2025-04-01T10:52:00Z") }, // I-5 N entering Grapevine
          
          // I-5 through Tejon Pass/Grapevine (slower due to elevation, 90-100 km/h)
          { lat: 34.3747, lng: -118.5285, timestamp: new Date("2025-04-01T10:57:00Z") }, // Steep grade on Grapevine
          { lat: 34.4208, lng: -118.5636, timestamp: new Date("2025-04-01T11:04:00Z") }, // Continuing on Grapevine
          { lat: 34.4639, lng: -118.6095, timestamp: new Date("2025-04-01T11:11:00Z") }, // Approaching Tejon Pass
          { lat: 34.5115, lng: -118.6471, timestamp: new Date("2025-04-01T11:18:00Z") }, // At Tejon Pass
          { lat: 34.5687, lng: -118.6838, timestamp: new Date("2025-04-01T11:25:00Z") }, // Beginning descent into Central Valley
          { lat: 34.6233, lng: -118.7196, timestamp: new Date("2025-04-01T11:32:00Z") }, // Descending Grapevine, entering Kern County
          
          // I-5 in Central Valley (120-130 km/h, very straight highway)
          { lat: 34.7068, lng: -118.7612, timestamp: new Date("2025-04-01T11:40:00Z") }, // Entering Central Valley
          { lat: 34.7984, lng: -118.8239, timestamp: new Date("2025-04-01T11:48:00Z") }, // Central Valley farmland
          { lat: 34.9029, lng: -118.8985, timestamp: new Date("2025-04-01T11:56:00Z") }, // Approaching Bakersfield
          { lat: 35.0145, lng: -119.0356, timestamp: new Date("2025-04-01T12:04:00Z") }, // North of Bakersfield
          { lat: 35.1341, lng: -119.1641, timestamp: new Date("2025-04-01T12:12:00Z") }, // Central Valley I-5 N 
          { lat: 35.2468, lng: -119.2834, timestamp: new Date("2025-04-01T12:20:00Z") }, // Near Buttonwillow
          { lat: 35.3642, lng: -119.4148, timestamp: new Date("2025-04-01T12:28:00Z") }, // Central Valley I-5 N
          { lat: 35.4878, lng: -119.5377, timestamp: new Date("2025-04-01T12:36:00Z") }, // Past Lost Hills
          { lat: 35.6109, lng: -119.6656, timestamp: new Date("2025-04-01T12:44:00Z") }, // Central Valley farmland
          { lat: 35.7351, lng: -119.7925, timestamp: new Date("2025-04-01T12:52:00Z") }, // Between Kettleman City and Coalinga
          { lat: 35.8614, lng: -120.0197, timestamp: new Date("2025-04-01T13:00:00Z") }, // Near Coalinga
          { lat: 35.9875, lng: -120.1488, timestamp: new Date("2025-04-01T13:08:00Z") }, // I-5 N in Fresno County
          { lat: 36.1167, lng: -120.2713, timestamp: new Date("2025-04-01T13:16:00Z") }, // Central Valley farmland
          { lat: 36.2462, lng: -120.3961, timestamp: new Date("2025-04-01T13:24:00Z") }, // I-5 N in Fresno County
          { lat: 36.3734, lng: -120.5232, timestamp: new Date("2025-04-01T13:32:00Z") }, // Approaching Merced County
          { lat: 36.5047, lng: -120.6514, timestamp: new Date("2025-04-01T13:40:00Z") }, // I-5 N in Merced County
          { lat: 36.6329, lng: -120.7836, timestamp: new Date("2025-04-01T13:48:00Z") }, // Central Valley farmland
          { lat: 36.7595, lng: -120.9124, timestamp: new Date("2025-04-01T13:56:00Z") }, // Approaching Los Banos
          { lat: 36.8852, lng: -121.0373, timestamp: new Date("2025-04-01T14:04:00Z") }, // Near Los Banos
          { lat: 37.0117, lng: -121.1684, timestamp: new Date("2025-04-01T14:12:00Z") }, // I-5 N past Los Banos
          
          // I-5 to I-580 Junction
          { lat: 37.1360, lng: -121.2970, timestamp: new Date("2025-04-01T14:22:00Z") }, // Approaching San Luis Reservoir
          { lat: 37.2585, lng: -121.4239, timestamp: new Date("2025-04-01T14:32:00Z") }, // San Luis Reservoir area
          { lat: 37.3492, lng: -121.5255, timestamp: new Date("2025-04-01T14:42:00Z") }, // Continuing north on I-5
          { lat: 37.4254, lng: -121.5637, timestamp: new Date("2025-04-01T14:48:00Z") }, // Approaching I-580 junction
          { lat: 37.4772, lng: -121.5831, timestamp: new Date("2025-04-01T14:54:00Z") }, // At I-5/I-580 interchange
          
          // I-580 West toward Bay Area (110-120 km/h)
          { lat: 37.5423, lng: -121.6587, timestamp: new Date("2025-04-01T15:04:00Z") }, // On I-580 W
          { lat: 37.5883, lng: -121.7318, timestamp: new Date("2025-04-01T15:14:00Z") }, // Continuing on I-580 W
          { lat: 37.6357, lng: -121.8146, timestamp: new Date("2025-04-01T15:24:00Z") }, // Tracy area
          { lat: 37.6716, lng: -121.8998, timestamp: new Date("2025-04-01T15:34:00Z") }, // Between Tracy and Livermore
          { lat: 37.7034, lng: -121.9824, timestamp: new Date("2025-04-01T15:44:00Z") }, // Approaching Altamont Pass
          { lat: 37.7250, lng: -122.0596, timestamp: new Date("2025-04-01T15:54:00Z") }, // Altamont Pass area
          { lat: 37.7301, lng: -122.1422, timestamp: new Date("2025-04-01T16:04:00Z") }, // Livermore area
          { lat: 37.7331, lng: -122.2089, timestamp: new Date("2025-04-01T16:14:00Z") }, // Dublin/Pleasanton area
          { lat: 37.7345, lng: -122.2854, timestamp: new Date("2025-04-01T16:24:00Z") }, // Castro Valley area
          
          // I-580 to I-80 to San Francisco (slower due to traffic, 80-90 km/h)
          { lat: 37.7422, lng: -122.3517, timestamp: new Date("2025-04-01T16:36:00Z") }, // Approaching Oakland
          { lat: 37.7694, lng: -122.3939, timestamp: new Date("2025-04-01T16:48:00Z") }, // Oakland area
          { lat: 37.8056, lng: -122.3183, timestamp: new Date("2025-04-01T17:00:00Z") }, // Merging onto I-80 W towards Bay Bridge
          { lat: 37.8189, lng: -122.3366, timestamp: new Date("2025-04-01T17:08:00Z") }, // Start of Bay Bridge
          { lat: 37.8185, lng: -122.3656, timestamp: new Date("2025-04-01T17:16:00Z") }, // On Bay Bridge
          { lat: 37.8059, lng: -122.3925, timestamp: new Date("2025-04-01T17:24:00Z") }, // Approaching SF on Bay Bridge
          { lat: 37.7897, lng: -122.4052, timestamp: new Date("2025-04-01T17:32:00Z") }, // Entering San Francisco
          { lat: 37.7845, lng: -122.4178, timestamp: new Date("2025-04-01T17:40:00Z") }, // In San Francisco, approaching downtown
          { lat: 37.7790, lng: -122.4194, timestamp: new Date("2025-04-01T17:44:00Z") }, // Downtown San Francisco
          { lat: 37.7793, lng: -122.4193, timestamp: new Date("2025-04-01T17:45:00Z") }, // Final destination: San Francisco City Hall
        ],
        targetReached: true,
      }
    ];

    initialLabels.forEach(label => {
      this.smartLabels.set(label.id, label);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Get all smart labels with their trace data
  async getAllSmartLabelsWithTrace(): Promise<SmartLabelWithTrace[]> {
    return Array.from(this.smartLabels.values());
  }

  // Get a specific smart label by ID
  async getSmartLabelWithTrace(id: string): Promise<SmartLabelWithTrace | undefined> {
    return this.smartLabels.get(id);
  }
  
  // Get all real-time labels
  async getRealTimeLabels(): Promise<RealTimeLabel[]> {
    return Array.from(this.realTimeLabels.values());
  }

  // Get a specific real-time label by MAC ID
  async getRealTimeLabelByMacId(macId: string): Promise<RealTimeLabel | undefined> {
    // Find label with matching MAC ID
    const labels = Array.from(this.realTimeLabels.values());
    return labels.find(label => label.macId === macId);
  }

  // Add a new real-time label
  async addRealTimeLabel(macId: string, name?: string): Promise<RealTimeLabel> {
    // Generate a unique ID
    const id = `rt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Default position (at Los Angeles)
    const defaultPosition: TracePoint = {
      lat: 34.0522,
      lng: -118.2437,
      timestamp: new Date(),
    };
    
    // Create the new label
    const label: RealTimeLabel = {
      id,
      macId,
      name: name || `Label-${macId}`,
      position: defaultPosition,
      lastUpdated: new Date(),
      isActive: true,
    };
    
    // Store it
    this.realTimeLabels.set(id, label);
    return label;
  }

  // Update position of a real-time label
  async updateRealTimeLabelPosition(id: string, position: TracePoint): Promise<RealTimeLabel | undefined> {
    const label = this.realTimeLabels.get(id);
    if (!label) {
      return undefined;
    }
    
    // Update position and last updated timestamp
    label.position = {
      ...position,
      timestamp: new Date(),
    };
    label.lastUpdated = new Date();
    
    // Update in storage
    this.realTimeLabels.set(id, label);
    return label;
  }
  
  async getShipRecAuthConfig(): Promise<AuthConfig | undefined> {
    return this.shipRecAuthConfig;
  }
  
  async setShipRecAuthConfig(config: AuthConfig): Promise<void> {
    this.shipRecAuthConfig = config;
  }

  async deleteShipRecAuthConfig(): Promise<void> {
    this.shipRecAuthConfig = undefined;
  }
}

export const storage = new MemStorage();

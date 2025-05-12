# InPlay Live Asset Tracking Dashboard - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Demo Mode](#demo-mode)
5. [Real-time Tracking Mode](#real-time-tracking-mode)
6. [ShipRec Integration](#shiprec-integration)
7. [Map Features](#map-features)
8. [Troubleshooting](#troubleshooting)

## Introduction

The InPlay Asset Tracking Dashboard is a comprehensive platform for monitoring and tracking assets in both simulated (demo) and real-time environments. This powerful tool allows logistics managers, fleet operators, and supply chain professionals to visualize asset movements, track delivery progress, and monitor real-time asset locations.

Key features include:
- Interactive map visualization with color-coded routes and markers
- Two operational modes: Demo and Real-time Tracking
- Smart Label tracking with detailed movement history
- ShipRec API integration for real package tracking
- Customizable time simulation controls
- Real-time WebSocket updates for live tracking
- Comprehensive filtering and search capabilities

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- ShipRec API key (for ShipRec integration features)

### Accessing the Dashboard
1. Open your web browser and navigate to the dashboard URL
2. The system will automatically load the dashboard interface
3. By default, the dashboard will start in Demo mode

## Dashboard Overview

The dashboard is divided into two main sections:

1. **Map Section** (Left/Center):
   - Interactive map displaying asset positions and routes
   - Search and filter controls
   - Simulation time controls
   - Map legend

2. **Sidebar** (Right):
   - Mode selector tabs (Demo/Real-time)
   - Asset list with status indicators
   - Real-time tracking controls
   - ShipRec integration tools

The top header displays the current simulation time and date, along with the InPlay branding.

## Demo Mode

Demo mode uses simulated data to demonstrate the tracking capabilities. This is ideal for training, demonstrations, or testing interface features without connecting to real devices.

### Features

- **Simulated Assets**: Pre-configured asset routes and behaviors
- **Time Simulation**: Control the speed of time passage (1x to 60x)
- **Color-coded Routes**: Different colors for each asset type
- **Movement Simulation**: Realistic movement patterns along predefined routes

### Using Demo Mode

1. Click the "Demo Mode" tab in the sidebar
2. Use the time controls at the bottom of the map to:
   - Play/Pause simulation
   - Adjust simulation speed
   - Restart simulation
3. Click on any asset to:
   - Center the map on that asset
   - View detailed information in the sidebar
4. Use History and Details buttons for more information about each asset

### Time Scale in Demo Mode

In Demo mode, the time simulation works as follows:
- At 1× speed: 1 real-time second = 1 minute of simulation time
- At 60× speed: 1 real-time second = 1 hour of simulation time

## Real-time Tracking Mode

Real-time mode connects to actual tracking devices to display their current positions on the map. It's designed for live monitoring of active assets.

### Features

- **Live Asset Tracking**: Real-time positions of actual devices
- **MAC ID Input**: Add new devices by entering their MAC IDs
- **ShipRec Integration**: Import real package tracking data
- **WebSocket Updates**: Instant position updates as they occur

### Using Real-time Mode

1. Click the "Real-time Tracking" tab in the sidebar
2. Add a tracking label by:
   - Entering a MAC ID in the input field
   - Optionally providing a friendly name
   - Clicking "Add Label"
3. Or import tracking data from ShipRec:
   - Configure your ShipRec API key
   - Browse available packages
   - Import selected packages for tracking
4. Use the time controls with a 1:1 time scale (real-time)

### Time Scale in Real-time Mode

In Real-time mode, the time simulation works as follows:
- At 1× speed: 1 real-time second = 1 real second (true real-time)
- Speeds from 0.5× to 8× are available for slower or faster viewing

## ShipRec Integration

The dashboard integrates with ShipRec's tracking API to import and display real-time package location data.

### Setup

1. In Real-time Tracking mode, locate the "ShipRec Integration" section
2. Click "Configure API Key"
3. Enter your ShipRec API key in the dialog
4. Click Save to store the key securely

### Importing Packages

1. After configuring your API key, click "Browse Packages"
2. View the list of available packages associated with your account
3. Click on any package to view its details
4. Click "Import for Tracking" to add it to your map
5. The package will appear on the map with real-time position updates

## Map Features

### Map Controls

- **Search**: Filter assets by name or description
- **Status Filter**: Show only assets with specific statuses (Moving, Idle, Delivered)
- **Map Layers**: Toggle between different map views
- **Centering**: Quickly center the map on your current location

### Legend

The map legend explains the symbols and colors used on the map:

- **Demo Mode Legend**:
  - Asset Status indicators (Moving, Idle, Delivered)
  - Asset Routes color coding
  - Route Markers (Start/End points)
  - Real-time label indicators

- **Real-time Mode Legend**:
  - Real-time label indicators only

### Asset Icons

- **Moving Assets**: Green dot with label name
- **Idle Assets**: Gray dot with label name
- **Delivered Assets**: Blue dot with label name
- **Real-time Assets**: Red heart icon with pulsing effect
- **Start Points**: Green flag icon
- **End Points**: Red pin icon

## Troubleshooting

### Common Issues

**Q: The map is not showing any assets in Real-time mode.**  
A: Ensure you have added at least one tracking label via MAC ID input or ShipRec import.

**Q: ShipRec integration is not working.**  
A: Verify that your API key is correct and that it has the necessary permissions.

**Q: The dashboard seems slow or unresponsive.**  
A: Try reducing the simulation speed in Demo mode, or refresh the page.

**Q: Real-time updates are not appearing.**  
A: Check your internet connection. The system requires an active WebSocket connection.

### Support

For additional support:
- Email: support@inplay-tracking.com
- Phone: (555) 123-4567
- Hours: Monday-Friday, 9 AM - 5 PM EST

---

© 2025 InPlay Asset Tracking Systems. All rights reserved.
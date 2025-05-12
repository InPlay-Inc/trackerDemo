import express, { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { TracePoint, ShipRecPackage, shipRecPackageSchema } from "@shared/schema";
import * as nodeFetch from "node-fetch";
import { IStorage } from "./storage";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

async function getAccessToken(storage: IStorage): Promise<string | null> {
  const config = await storage.getShipRecAuthConfig();
  if (!config) {
    return null;
  }

  try {
    const fetch = nodeFetch.default;
    const response = await fetch('https://auth.shiprec.io/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: 'write:packages openid',
        username: config.username,
        password: config.password
      })
    });

    if (!response.ok) {
      console.error('Error getting access token:', await response.text());
      return null;
    }

    const data = await response.json() as TokenResponse;
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // GET endpoint to fetch all smart labels with traces
  app.get('/api/smart-labels', async (req, res) => {
    try {
      const labels = await storage.getAllSmartLabelsWithTrace();
      res.json(labels);
    } catch (error) {
      console.error('Error fetching smart labels:', error);
      res.status(500).json({ message: 'Failed to fetch smart labels' });
    }
  });

  // GET endpoint to fetch a specific smart label by ID
  app.get('/api/smart-labels/:id', async (req, res) => {
    try {
      const label = await storage.getSmartLabelWithTrace(req.params.id);
      if (!label) {
        return res.status(404).json({ message: 'Smart label not found' });
      }
      res.json(label);
    } catch (error) {
      console.error('Error fetching smart label:', error);
      res.status(500).json({ message: 'Failed to fetch smart label' });
    }
  });

  // GET all real-time labels
  app.get('/api/real-time-labels', async (req, res) => {
    try {
      const labels = await storage.getRealTimeLabels();
      res.json(labels);
    } catch (error) {
      console.error('Error fetching real-time labels:', error);
      res.status(500).json({ message: 'Failed to fetch real-time labels' });
    }
  });

  // GET real-time label by MAC ID
  app.get('/api/real-time-labels/mac/:macId', async (req, res) => {
    try {
      const label = await storage.getRealTimeLabelByMacId(req.params.macId);
      if (!label) {
        return res.status(404).json({ message: 'Real-time label not found' });
      }
      res.json(label);
    } catch (error) {
      console.error('Error fetching real-time label:', error);
      res.status(500).json({ message: 'Failed to fetch real-time label' });
    }
  });

  // POST to add a new real-time label
  app.post('/api/real-time-labels', async (req, res) => {
    try {
      const { macId, name } = req.body;
      
      if (!macId) {
        return res.status(400).json({ message: 'MAC ID is required' });
      }
      
      // Check if label with this MAC ID already exists
      const existingLabel = await storage.getRealTimeLabelByMacId(macId);
      if (existingLabel) {
        return res.json(existingLabel); // Return existing label if found
      }
      
      // Create new label
      const newLabel = await storage.addRealTimeLabel(macId, name);
      res.status(201).json(newLabel);
    } catch (error) {
      console.error('Error creating real-time label:', error);
      res.status(500).json({ message: 'Failed to create real-time label' });
    }
  });

  // PUT to update a real-time label's position
  app.put('/api/real-time-labels/:id/position', async (req, res) => {
    try {
      const { lat, lng } = req.body;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return res.status(400).json({ message: 'Valid latitude and longitude are required' });
      }
      
      const position: TracePoint = {
        lat,
        lng,
        timestamp: new Date()
      };
      
      const updatedLabel = await storage.updateRealTimeLabelPosition(req.params.id, position);
      
      if (!updatedLabel) {
        return res.status(404).json({ message: 'Real-time label not found' });
      }
      
      res.json(updatedLabel);
    } catch (error) {
      console.error('Error updating real-time label position:', error);
      res.status(500).json({ message: 'Failed to update real-time label position' });
    }
  });

  // GET real-time label by ID
  app.get('/api/real-time-labels/:id', async (req, res) => {
    try {
      const labels = await storage.getRealTimeLabels();
      const label = labels.find(l => l.id === req.params.id);
      
      if (!label) {
        return res.status(404).json({ message: 'Real-time label not found' });
      }
      
      res.json(label);
    } catch (error) {
      console.error('Error fetching real-time label:', error);
      res.status(500).json({ message: 'Failed to fetch real-time label' });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // GET endpoint to fetch packages from ShipRec API
  app.get('/api/shiprec/packages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const nextToken = req.query.nextToken as string;
      
      // Validate limit
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        return res.status(400).json({ message: 'Invalid limit parameter. Must be between 1 and 1000.' });
      }
      
      // Build URL
      let url = `https://track.shiprec.io/api/packages/list?tokenPagination=true&limit=${limit}`;
      if (nextToken) {
        url += `&nextToken=${encodeURIComponent(nextToken)}`;
      }
      
      // Get access token
      const accessToken = await getAccessToken(storage);
      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication is not configured or failed' });
      }
      
      // Make request to ShipRec API
      const fetch = nodeFetch.default;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        let errorText = await response.text();
        try {
          errorText = JSON.parse(errorText).message || errorText;
        } catch (e) {
          // If parsing fails, just use the original text
        }
        return res.status(response.status).json({ 
          message: `Error from ShipRec API: ${errorText}`,
          statusCode: response.status
        });
      }
      
      // Parse response
      const packages = await response.json();
      
      // Get next token from response header
      const newNextToken = response.headers.get('x-api-next-token');
      
      // Return response
      res.json(packages);

      // If there's a next token, include it in the response headers
      if (newNextToken) {
        res.setHeader('x-api-next-token', newNextToken);
      }
    } catch (error) {
      console.error('Error fetching ShipRec packages:', error);
      res.status(500).json({ message: 'Failed to fetch packages from ShipRec API' });
    }
  });
  
  // GET endpoint to track a specific package
  app.get('/api/shiprec/packages/track/:tokenId', async (req, res) => {
    try {
      const tokenId = req.params.tokenId;
      const intervalHours = req.query.interval_hours ? parseInt(req.query.interval_hours as string) : 1;
      
      // Validate intervalHours
      const validatedInterval = Math.min(Math.max(1, intervalHours), 168); // 7 * 24 = 168 hours (1 week)
      
      // Get access token
      const accessToken = await getAccessToken(storage);
      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication is not configured or failed' });
      }
      
      // Make request to ShipRec API
      const fetch = nodeFetch.default;
      const response = await fetch(
        `https://track.shiprec.io/api/packages/track?token=${tokenId}&interval_hours=${validatedInterval}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        let errorText = await response.text();
        try {
          errorText = JSON.parse(errorText).message || errorText;
        } catch (e) {
          // If parsing fails, just use the original text
        }
        return res.status(response.status).json({ 
          message: `Error from ShipRec API: ${errorText}`,
          statusCode: response.status
        });
      }
      
      // Return the parsed response
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error tracking ShipRec package:', error);
      res.status(500).json({ message: 'Failed to track package from ShipRec API' });
    }
  });
  
  // POST endpoint to store ShipRec auth configuration
  app.post('/api/shiprec/config/auth', async (req, res) => {
    try {
      const { clientId, clientSecret, username, password } = req.body;
      
      if (!clientId || !clientSecret || !username || !password) {
        return res.status(400).json({ message: 'All authentication parameters are required' });
      }
      
      await storage.setShipRecAuthConfig({ clientId, clientSecret, username, password });
      res.json({ message: 'Authentication configuration stored successfully' });
    } catch (error) {
      console.error('Error storing ShipRec auth config:', error);
      res.status(500).json({ message: 'Failed to store authentication configuration' });
    }
  });
  
  // DELETE endpoint to remove ShipRec auth configuration
  app.delete('/api/shiprec/config/auth', async (req, res) => {
    try {
      await storage.deleteShipRecAuthConfig();
      res.json({ message: 'Authentication configuration deleted successfully' });
    } catch (error) {
      console.error('Error deleting ShipRec auth config:', error);
      res.status(500).json({ message: 'Failed to delete authentication configuration' });
    }
  });
  
  // GET endpoint to check if ShipRec auth is configured
  app.get('/api/shiprec/config/status', async (req, res) => {
    try {
      const config = await storage.getShipRecAuthConfig();
      res.json({ configured: !!config });
    } catch (error) {
      console.error('Error checking ShipRec configuration:', error);
      res.status(500).json({ message: 'Failed to check configuration' });
    }
  });

  // POST endpoint to add a new package
  app.post('/api/shiprec/packages/new', async (req, res) => {
    try {
      const { deviceId, name, email, address } = req.body;
      
      if (!deviceId) {
        return res.status(400).json({ message: 'Device ID is required' });
      }
      
      // Get access token
      const accessToken = await getAccessToken(storage);
      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication is not configured or failed' });
      }
      
      // Make request to ShipRec API
      const fetch = nodeFetch.default;
      const response = await fetch('https://track.shiprec.io/api/packages/new', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId,
          name,
          email,
          address
        })
      });
      
      if (!response.ok) {
        let errorText = await response.text();
        try {
          errorText = JSON.parse(errorText).message || errorText;
        } catch (e) {
          // If parsing fails, just use the original text
        }
        return res.status(response.status).json({ 
          message: `Error from ShipRec API: ${errorText}`,
          statusCode: response.status
        });
      }
      
      // Return the parsed response
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error adding ShipRec package:', error);
      res.status(500).json({ message: 'Failed to add package to ShipRec API' });
    }
  });

  // GET endpoint to get device metadata
  app.get('/api/shiprec/packages/device/:tokenId', async (req, res) => {
    try {
      const tokenId = req.params.tokenId;
      
      // Get access token
      const accessToken = await getAccessToken(storage);
      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication is not configured or failed' });
      }
      
      // Make request to ShipRec API
      const fetch = nodeFetch.default;
      const response = await fetch(
        `https://track.shiprec.io/api/packages/device?token=${tokenId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        let errorText = await response.text();
        try {
          errorText = JSON.parse(errorText).message || errorText;
        } catch (e) {
          // If parsing fails, just use the original text
        }
        return res.status(response.status).json({ 
          message: `Error from ShipRec API: ${errorText}`,
          statusCode: response.status
        });
      }
      
      // Return the parsed response
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error getting device metadata:', error);
      res.status(500).json({ message: 'Failed to get device metadata from ShipRec API' });
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Send all real-time labels to the client on connection
    storage.getRealTimeLabels().then(labels => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'labels', data: labels }));
      }
    });
    
    // Handle incoming messages from clients
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'update-position' && data.id && data.position) {
          const { id, position } = data;
          // Update the label's position
          const updatedLabel = await storage.updateRealTimeLabelPosition(id, position);
          
          if (updatedLabel) {
            // Broadcast the update to all connected clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ 
                  type: 'label-updated', 
                  data: updatedLabel 
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  return httpServer;
}

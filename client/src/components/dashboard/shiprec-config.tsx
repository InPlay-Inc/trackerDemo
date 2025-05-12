import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { checkShipRecAuthStatus, configureShipRecAuth, deleteShipRecAuth } from '@/lib/shiprec-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Form schema
const authSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

type AuthFormValues = z.infer<typeof authSchema>;

interface ShipRecConfigProps {
  onConfigured?: () => void;
}

// Local storage key
const SHIPREC_CONFIG_KEY = 'shiprec-config';

export function ShipRecConfig({ onConfigured }: ShipRecConfigProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      username: '',
      password: ''
    }
  });

  // Load configuration from local storage
  useEffect(() => {
    const loadConfig = async () => {
      const storedConfig = localStorage.getItem(SHIPREC_CONFIG_KEY);
      
      if (storedConfig) {
        try {
          const config = JSON.parse(storedConfig);
          form.reset(config);
        } catch (error) {
          console.error('Error loading stored config:', error);
        }
      }
    };
    
    loadConfig();
  }, [form]);

  // Check auth status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const status = await checkShipRecAuthStatus();
        setIsConfigured(status);
        
        // If not configured, clear local storage
        if (!status) {
          localStorage.removeItem(SHIPREC_CONFIG_KEY);
          form.reset({
            clientId: '',
            clientSecret: '',
            username: '',
            password: ''
          });
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [form]);

  // Form submit handler
  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    try {
      const success = await configureShipRecAuth(data);
      
      if (success) {
        setIsConfigured(true);
        // Save configuration to local storage
        localStorage.setItem(SHIPREC_CONFIG_KEY, JSON.stringify(data));
        
        toast({
          title: 'Configuration Success',
          description: 'Your InPlay authentication has been successfully configured.',
          variant: 'default'
        });
        
        if (onConfigured) {
          onConfigured();
        }
      } else {
        toast({
          title: 'Configuration Failed',
          description: 'Failed to configure InPlay authentication. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error configuring auth:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle configuration deletion
  const handleDeleteConfig = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteShipRecAuth();
      
      if (success) {
        setIsConfigured(false);
        // Clear local storage
        localStorage.removeItem(SHIPREC_CONFIG_KEY);
        // Reset form
        form.reset({
          clientId: '',
          clientSecret: '',
          username: '',
          password: ''
        });
        
        toast({
          title: 'Configuration Deleted',
          description: 'Your InPlay authentication configuration has been deleted.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Deletion Failed',
          description: 'Failed to delete InPlay authentication configuration.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting auth config:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the configuration.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          InPlay Authentication
          {isConfigured !== null && (
            <Badge variant={isConfigured ? 'default' : 'destructive'}>
              {isConfigured ? 'Configured' : 'Not Configured'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Enter your InPlay authentication details to enable package tracking features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your Client ID"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your Client Secret"
                      type="password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your password"
                      type="password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || isDeleting} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>
              {isConfigured && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={isLoading || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Configuration</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete your InPlay authentication configuration? 
                        This will disable package tracking features until you reconfigure.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteConfig}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Configuration'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        {isConfigured ? 
          'Your authentication configuration is stored securely.' : 
          'You need to configure authentication to use InPlay tracking features.'
        }
      </CardFooter>
    </Card>
  );
}
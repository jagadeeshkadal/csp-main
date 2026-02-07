import { useState, useEffect, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';

interface PhoneNumberFormProps {
  token: string;
  onSuccess: () => void;
}

// Common country codes
const countryCodes = [
  { code: '+1', country: 'US/Canada' },
  { code: '+91', country: 'India' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+31', country: 'Netherlands' },
  { code: '+46', country: 'Sweden' },
  { code: '+47', country: 'Norway' },
  { code: '+45', country: 'Denmark' },
  { code: '+41', country: 'Switzerland' },
  { code: '+32', country: 'Belgium' },
  { code: '+351', country: 'Portugal' },
  { code: '+353', country: 'Ireland' },
  { code: '+358', country: 'Finland' },
  { code: '+48', country: 'Poland' },
  { code: '+7', country: 'Russia/Kazakhstan' },
  { code: '+82', country: 'South Korea' },
  { code: '+65', country: 'Singapore' },
  { code: '+60', country: 'Malaysia' },
  { code: '+66', country: 'Thailand' },
  { code: '+84', country: 'Vietnam' },
  { code: '+62', country: 'Indonesia' },
  { code: '+63', country: 'Philippines' },
  { code: '+64', country: 'New Zealand' },
  { code: '+27', country: 'South Africa' },
  { code: '+55', country: 'Brazil' },
  { code: '+52', country: 'Mexico' },
  { code: '+54', country: 'Argentina' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+974', country: 'Qatar' },
  { code: '+965', country: 'Kuwait' },
  { code: '+973', country: 'Bahrain' },
  { code: '+968', country: 'Oman' },
  { code: '+961', country: 'Lebanon' },
  { code: '+20', country: 'Egypt' },
  { code: '+90', country: 'Turkey' },
  { code: '+92', country: 'Pakistan' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+95', country: 'Myanmar' },
  { code: '+977', country: 'Nepal' },
];

export function PhoneNumberForm({ token, onSuccess }: PhoneNumberFormProps) {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Combine country code and phone number
      const formattedPhone = `${countryCode}${phoneNumber.replace(/^\+/, '').trim()}`;

      const response = await authAPI.ssoSignup({
        token,
        phoneNumber: formattedPhone,
      });

      // Ensure token is stored before navigating
      if (!response.token || !response.user) {
        throw new Error('Signup succeeded but token was not returned');
      }

      // Verify token is actually stored in localStorage
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        console.error('Token was not stored in localStorage after signup');
        throw new Error('Failed to store authentication token');
      }

      console.log('[PhoneNumberForm] Signup successful, token stored:', storedToken.substring(0, 20) + '...');
      console.log('[PhoneNumberForm] User ID:', response.user.id);

      // Verify the token works by making a test call to getCurrentUser
      try {
        await authAPI.getCurrentUser();
        console.log('[PhoneNumberForm] Token verified successfully');
      } catch (error: any) {
        console.error('[PhoneNumberForm] Token verification failed:', error);
        // Don't throw - the token might just need a moment to be valid
        // But log it for debugging
      }

      // Small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 300));

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete sign up');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Please provide your phone number to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center justify-between w-24 h-10 px-3 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <span>{countryCode}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-auto rounded-md border bg-background shadow-lg">
                    <div className="p-1">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(country.code);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-medium">{country.code}</span>
                          <span className="text-xs text-muted-foreground">{country.country}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <Input
                id="phone"
                type="tel"
                placeholder="1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                required
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select your country code and enter your phone number
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect, useRef } from 'react';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';

interface PhoneNumberFormProps {
  token: string;
  avatar?: string | null;
  onSuccess: () => void;
}

// Common country codes
const countryCodes = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'US/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
];

export function PhoneNumberForm({ token, avatar, onSuccess }: PhoneNumberFormProps) {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [departmentName, setDepartmentName] = useState('');
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

    if (phoneNumber.length !== 10) {
      setError('Phone number must be exactly 10 digits');
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
        teamNumber: teamNumber || undefined,
        departmentName: departmentName || undefined,
        avatar: avatar || undefined,
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
    <div className="w-full bg-transparent p-6 flex items-center justify-end h-full">
      <div className="w-full h-full bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/30 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center overflow-auto">
        <h2 className="text-[2.5rem] leading-[1.1] font-normal text-white mb-4 tracking-normal self-start w-full text-left">
          Complete Profile
        </h2>
        <p className="text-zinc-400 text-lg font-light tracking-wide mb-8 leading-relaxed self-start w-full text-left">
          Please provide additional details to continue.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Phone Number Section */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-zinc-300">Phone Number (10 digits)</Label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="relative flex-shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center justify-between w-24 h-12 px-3 border border-zinc-700 bg-zinc-800/50 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
                  disabled={loading}
                >
                  <span>{countryCode}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {showCountryDropdown && (
                  <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
                    <div className="p-1">
                      {countryCodes.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(country.code);
                            setShowCountryDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <span className="font-medium">{country.code}</span>
                          <span className="text-xs text-zinc-500">{country.country}</span>
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
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhoneNumber(val);
                }}
                disabled={loading}
                required
                className="flex-1 h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl focus:ring-primary"
              />
            </div>
          </div>

          {/* Team Number */}
          <div className="space-y-2">
            <Label htmlFor="teamNumber" className="text-zinc-300">Team Number</Label>
            <Input
              id="teamNumber"
              type="number"
              placeholder="Enter team number"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              disabled={loading}
              className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl focus:ring-primary"
            />
          </div>

          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="departmentName" className="text-zinc-300">Department Name</Label>
            <Input
              id="departmentName"
              type="text"
              placeholder="Enter department name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              disabled={loading}
              className="h-12 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 rounded-xl focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all"
          >
            {loading ? 'Creating account...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/features/users/users.api';
import {
  Button, Input, Card, CardHeader, CardTitle, CardDescription,
  DashboardHeader, PageTransition, FadeIn, LoadingScreen,
} from '@/components/ui';
import { User, Mail, Building2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        company: user.company || '',
      });
    }
  }, [user, loading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await usersApi.updateProfile({
        name: formData.name,
        email: formData.email,
        company: formData.company,
      });
      const { token, ...updatedUser } = response.data;
      updateUser(
        {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          company: updatedUser.company,
          createdAt: updatedUser.createdAt,
        },
        token,
      );
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return <LoadingScreen message="Loading profile..." />;
  }

  return (
    <>
      <DashboardHeader
        title="Profile Settings"
        description="Update your personal information"
        backHref="/dashboard"
      />

      <main className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageTransition>
          <FadeIn>
            {/* Profile Avatar Card */}
            <Card className="mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-linear-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  {user.company && (
                    <p className="text-sm text-slate-400 mt-0.5">{user.company}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Edit Form Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your name, email, or company
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <Input
                  label="Full Name"
                  icon={User}
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors({ ...errors, name: '' });
                  }}
                  placeholder="John Doe"
                  error={errors.name}
                  autoComplete="name"
                />
                <Input
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors({ ...errors, email: '' });
                  }}
                  placeholder="you@example.com"
                  error={errors.email}
                  helperText="Changing your email will not affect your connections"
                  autoComplete="email"
                />
                <Input
                  label="Company"
                  icon={Building2}
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Acme Inc."
                  helperText="Optional — used for grouping and context"
                  autoComplete="organization"
                />
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    Save Changes
                  </Button>
                  <Link href="/dashboard">
                    <Button type="button" variant="outline" size="lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </Card>
          </FadeIn>
        </PageTransition>
      </main>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/lib/api';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    if (!listName) {
      // Auto-fill name from filename
      const nameWithoutExt = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '');
      setListName(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !listName.trim()) {
      toast.error('Please provide both a file and a name');
      return;
    }

    setUploading(true);
    try {
      const response = await accountListsApi.upload(file, listName.trim());
      toast.success('Account list uploaded successfully!');
      router.push(`/dashboard/lists/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Upload Account List</h1>
              <p className="text-sm text-gray-600 mt-1">Import your accounts from CSV or Excel</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <Card>
            <Input
              id="listName"
              label="List Name"
              type="text"
              required
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="e.g., Q1 2024 Target Accounts"
              helperText="Choose a descriptive name for your account list"
            />
          </Card>

          {/* File Upload */}
          <Card>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Upload File (CSV or Excel)
            </label>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
            >
              {file ? (
                <div>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    type="button"
                    onClick={() => setFile(null)}
                    variant="ghost"
                    size="sm"
                  >
                    Remove file
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      onChange={handleFileInput}
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-4">
                    Supported formats: CSV, XLSX, XLS
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="bg-sky-50 border-sky-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sky-900 mb-2">File Format Requirements</h3>
                <p className="text-sm text-sky-700 mb-3">
                  Your file should contain account names in the first column. For example:
                </p>
                <div className="bg-white rounded-lg p-3 text-sm font-mono text-gray-700 border border-sky-200 space-y-1">
                  <div>Acme Corporation</div>
                  <div>TechStart Inc</div>
                  <div>Global Solutions LLC</div>
                </div>
                <p className="text-xs text-sky-600 mt-3">
                  Headers are optional. Only the first column will be imported.
                </p>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={uploading || !file || !listName.trim()}
            variant="primary"
            size="lg"
            isLoading={uploading}
            className="w-full"
          >
            Upload Account List
          </Button>
        </form>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/lib/api';
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
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Upload Account List
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* List Name */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label htmlFor="listName" className="block text-sm font-medium text-gray-700 mb-2">
              List Name
            </label>
            <input
              id="listName"
              type="text"
              required
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Q1 2024 Target Accounts"
            />
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-xl shadow-sm p-6">
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
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              {file ? (
                <div>
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">📤</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label className="cursor-pointer inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
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
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 File Format</h3>
            <p className="text-sm text-blue-700 mb-2">
              Your file should contain account names in the first column. For example:
            </p>
            <div className="bg-white rounded-lg p-3 text-sm font-mono text-gray-700 border border-blue-200">
              <div>Acme Corporation</div>
              <div>TechStart Inc</div>
              <div>Global Solutions LLC</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Headers are optional. Only the first column will be imported.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !file || !listName.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {uploading ? 'Uploading...' : 'Upload Account List'}
          </button>
        </form>
      </main>
    </div>
  );
}

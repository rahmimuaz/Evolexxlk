import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import './BankTransferModal.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const BankTransferModal = ({ onClose, onSubmit }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUser();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('File size too large. Maximum size is 5MB.');
        toast.error('File size too large. Maximum size is 5MB.');
        return;
      }

      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError('');
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError('Please upload a PDF or an image file (JPG, PNG, GIF).');
        toast.error('Please upload a PDF or an image file (JPG, PNG, GIF).');
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please attach your bank transfer proof (PDF or Image).');
      toast.error('Please attach your bank transfer proof (PDF or Image).');
      return;
    }

    if (!user || !user.token) {
      setError('Please log in to upload files.');
      toast.error('Please log in to upload files.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('proof', selectedFile);

      console.log('Uploading file:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      const response = await fetch(`${API_BASE_URL}/api/upload/bank-transfer-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload success response:', data);
      
      toast.success('File uploaded successfully! Proceeding with order placement.');
      onSubmit(data.fileUrl);
      onClose();
    } catch (uploadError) {
      console.error('File upload failed:', uploadError);
      setError(uploadError.message || 'Failed to upload file. Please try again.');
      toast.error(uploadError.message || 'Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Bank Transfer Confirmation</h2>
        <p className="modal-description">
          Please transfer the total amount to the following bank details and attach a screenshot or PDF of the transfer confirmation.
        </p>

        <div className="bank-details-box">
          <p>Bank name : Commercial Bank PLC</p>
          <p>Account Name: MMR.MUAZ</p>
          <p>Account Number: 8018815463</p>
          <p>Branch name : Mawanella</p>
        </div>

        <div className="file-upload-section">
  <label htmlFor="transferProof" className="file-upload-label">
    Attach Transfer Proof (PDF or Image - Max 5MB)
  </label>
  <input
    type="file"
    id="transferProof"
    accept="image/*, application/pdf"
    onChange={handleFileChange}
    className="file-input"
  />

  {selectedFile && (
    <div className="selected-file-info">
      <p className="selected-file-name">
        Selected file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
      </p>
      <button
        type="button"
        className="remove-file-button"
        onClick={() => {
          setSelectedFile(null);
          setPreviewUrl(null);
          setError('');
          // Also clear the input value to allow re-uploading the same file if needed
          document.getElementById('transferProof').value = '';
        }}
      >
        Remove
      </button>
    </div>
  )}

  {previewUrl && selectedFile && selectedFile.type.startsWith('image/') && (
    <div className="preview-container">
      <img src={previewUrl} alt="File Preview" className="image-preview" />
    </div>
  )}
  {previewUrl && selectedFile && selectedFile.type === 'application/pdf' && (
    <div className="preview-container">
      <p className="pdf-info">PDF file attached. Preview not available here.</p>
    </div>
  )}

  {error && (
    <p className="error-message">{error}</p>
  )}
</div>


        <div className="modal-actions">
          <button
            onClick={onClose}
            className="modal-button cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || uploading}
            className="modal-button confirm-button"
          >
            {uploading ? 'Uploading...' : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankTransferModal;

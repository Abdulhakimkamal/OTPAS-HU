/**
 * File Upload Service
 * Handles business logic for project file uploads
 * Requirements: 1.6, 4.4, 8.1, 8.2, 8.3, 8.4, 8.5
 */

import fs from 'fs/promises';
import path from 'path';
import ProjectModel from '../models/project.model.js';
import pool from '../config/database.js';

class FileUploadService {
  /**
   * Upload project file
   * Verifies project title is approved before allowing upload
   * Stores file metadata in database
   * @param {number} projectId - Project ID
   * @param {number} studentId - Student ID (for verification)
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} File metadata
   */
  static async uploadProjectFile(projectId, studentId, file) {
    if (!file) {
      throw new Error('No file provided');
    }

    // Get project to verify ownership and approval status
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Verify student owns this project
    if (project.student_id !== studentId) {
      throw new Error(`Student ${studentId} does not own project ${projectId}`);
    }

    // Verify project title is approved
    if (project.status !== 'approved') {
      throw new Error(
        `Cannot upload files for project with ${project.status} title. Title must be approved first.`
      );
    }

    // Store file metadata in database
    const fileMetadata = await this.storeFileMetadata(
      projectId,
      file.filename,
      file.originalname,
      file.mimetype,
      file.size
    );

    return fileMetadata;
  }

  /**
   * Store file metadata in database
   * @param {number} projectId - Project ID
   * @param {string} filePath - Path to uploaded file
   * @param {string} fileName - Original file name
   * @param {string} fileType - MIME type
   * @param {number} fileSize - File size in bytes
   * @returns {Promise<Object>} Stored file metadata
   */
  static async storeFileMetadata(projectId, filePath, fileName, fileType, fileSize) {
    const query = `
      INSERT INTO project_files (project_id, file_path, file_name, file_type, file_size, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, project_id, file_path, file_name, file_type, file_size, uploaded_at
    `;

    const values = [projectId, filePath, fileName, fileType, fileSize];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Verify project title is approved
   * @param {number} projectId - Project ID
   * @returns {Promise<boolean>} True if approved, false otherwise
   */
  static async verifyTitleApproved(projectId) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return false;
    }
    return project.status === 'approved';
  }

  /**
   * Get all files for a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} Array of file metadata
   */
  static async getProjectFiles(projectId) {
    const query = `
      SELECT id, project_id, file_path, file_name, file_type, file_size, uploaded_at
      FROM project_files
      WHERE project_id = $1
      ORDER BY uploaded_at DESC
    `;

    const result = await pool.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Get file by ID
   * @param {number} fileId - File ID
   * @returns {Promise<Object>} File metadata
   */
  static async getFileById(fileId) {
    const query = `
      SELECT id, project_id, file_path, file_name, file_type, file_size, uploaded_at
      FROM project_files
      WHERE id = $1
    `;

    const result = await pool.query(query, [fileId]);
    return result.rows[0] || null;
  }

  /**
   * Delete file
   * Removes file metadata from database and optionally deletes physical file
   * @param {number} fileId - File ID
   * @param {number} studentId - Student ID (for verification)
   * @param {boolean} deletePhysical - Whether to delete physical file
   * @returns {Promise<Object>} Deleted file metadata
   */
  static async deleteFile(fileId, studentId, deletePhysical = false) {
    // Get file metadata
    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    // Verify student owns the project
    const project = await ProjectModel.findById(file.project_id);
    if (!project || project.student_id !== studentId) {
      throw new Error('Unauthorized: Student does not own this file');
    }

    // Delete physical file if requested
    if (deletePhysical && file.file_path) {
      try {
        await fs.unlink(file.file_path);
      } catch (error) {
        console.error(`Failed to delete physical file: ${file.file_path}`, error);
        // Continue with database deletion even if physical file deletion fails
      }
    }

    // Delete file metadata from database
    const query = 'DELETE FROM project_files WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [fileId]);
    return result.rows[0];
  }

  /**
   * Get file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Human-readable file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Validate file type
   * @param {string} mimeType - MIME type of file
   * @param {Array<string>} allowedTypes - Array of allowed MIME types
   * @returns {boolean} True if file type is allowed
   */
  static isFileTypeAllowed(mimeType, allowedTypes = null) {
    // Default allowed types
    const defaultAllowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];

    const typesToCheck = allowedTypes || defaultAllowed;
    return typesToCheck.includes(mimeType);
  }

  /**
   * Validate file size
   * @param {number} fileSize - File size in bytes
   * @param {number} maxSize - Maximum allowed size in bytes (default: 50MB)
   * @returns {boolean} True if file size is within limit
   */
  static isFileSizeValid(fileSize, maxSize = 50 * 1024 * 1024) {
    return fileSize > 0 && fileSize <= maxSize;
  }

  /**
   * Get project file statistics
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} File statistics
   */
  static async getProjectFileStats(projectId) {
    const query = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        MAX(uploaded_at) as last_upload
      FROM project_files
      WHERE project_id = $1
    `;

    const result = await pool.query(query, [projectId]);
    const stats = result.rows[0];

    return {
      total_files: parseInt(stats.total_files) || 0,
      total_size: stats.total_size || 0,
      total_size_formatted: this.formatFileSize(stats.total_size || 0),
      last_upload: stats.last_upload || null
    };
  }
}

export default FileUploadService;

import pool from '../config/database.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import fs from 'fs';
import path from 'path';

class TutorialFilesController {
  /**
   * Upload tutorial file (Instructor/Admin only)
   */
  static uploadFile = async (req, res) => {
    try {
      const { tutorialId } = req.params;
      const { description } = req.body;
      const uploadedBy = req.user.id;
      const userRole = req.user.role;

      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Verify tutorial exists and user has permission
      const tutorialQuery = `
        SELECT t.*, c.department_id, ci.instructor_id as assigned_instructor
        FROM tutorials t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN course_instructors ci ON c.id = ci.course_id AND ci.is_active = true
        WHERE t.id = $1
      `;
      
      const tutorialResult = await pool.query(tutorialQuery, [tutorialId]);
      
      if (tutorialResult.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Tutorial not found'
        });
      }

      const tutorial = tutorialResult.rows[0];

      // Check permissions
      if (userRole === 'instructor') {
        // Instructor can only upload to their assigned courses
        const isAssigned = tutorialResult.rows.some(row => row.assigned_instructor === uploadedBy);
        if (!isAssigned) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'You can only upload files to tutorials for courses you are assigned to'
          });
        }
      } else if (userRole === 'department_head') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Department heads cannot upload tutorial files. Only instructors can upload materials.'
        });
      } else if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only instructors and admins can upload tutorial files'
        });
      }

      // Save file info to database
      const insertQuery = `
        INSERT INTO tutorial_files (
          tutorial_id, file_name, file_path, file_type, file_size, 
          mime_type, uploaded_by, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        tutorialId,
        req.file.originalname,
        req.file.path,
        path.extname(req.file.originalname),
        req.file.size,
        req.file.mimetype,
        uploadedBy,
        description || null
      ];

      const result = await pool.query(insertQuery, values);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'File uploaded successfully',
        file: result.rows[0]
      });

    } catch (error) {
      console.error('Upload file error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Upload tutorial video (Instructor/Admin only)
   */
  static uploadVideo = async (req, res) => {
    try {
      const { tutorialId } = req.params;
      const { video_title, description, duration_seconds } = req.body;
      const uploadedBy = req.user.id;
      const userRole = req.user.role;

      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'No video file provided'
        });
      }

      // Verify tutorial exists and user has permission (same logic as file upload)
      const tutorialQuery = `
        SELECT t.*, c.department_id, ci.instructor_id as assigned_instructor
        FROM tutorials t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN course_instructors ci ON c.id = ci.course_id AND ci.is_active = true
        WHERE t.id = $1
      `;
      
      const tutorialResult = await pool.query(tutorialQuery, [tutorialId]);
      
      if (tutorialResult.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Tutorial not found'
        });
      }

      // Check permissions (same as file upload)
      if (userRole === 'instructor') {
        const isAssigned = tutorialResult.rows.some(row => row.assigned_instructor === uploadedBy);
        if (!isAssigned) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'You can only upload videos to tutorials for courses you are assigned to'
          });
        }
      } else if (userRole === 'department_head') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Department heads cannot upload tutorial videos. Only instructors can upload materials.'
        });
      } else if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only instructors and admins can upload tutorial videos'
        });
      }

      // Save video info to database
      const insertQuery = `
        INSERT INTO tutorial_videos (
          tutorial_id, video_title, video_url, video_type, duration_seconds,
          file_size, uploaded_by, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        tutorialId,
        video_title || req.file.originalname,
        req.file.path,
        path.extname(req.file.originalname),
        duration_seconds || null,
        req.file.size,
        uploadedBy,
        description || null
      ];

      const result = await pool.query(insertQuery, values);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Video uploaded successfully',
        video: result.rows[0]
      });

    } catch (error) {
      console.error('Upload video error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Add video link (Instructor/Admin only)
   */
  static addVideoLink = async (req, res) => {
    try {
      const { tutorialId } = req.params;
      const { title, video_url, video_type } = req.body;
      const uploadedBy = req.user.id;
      const userRole = req.user.role;

      console.log('=== ADD VIDEO LINK ===');
      console.log('Request body:', req.body);
      console.log('video_type:', video_type);
      console.log('User:', { uploadedBy, userRole });

      if (!title || !video_url || !video_type) {
        console.log('Missing required fields');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Title, video URL, and video type are required'
        });
      }

      console.log('Validation passed, checking tutorial...');

      // Verify tutorial exists and user has permission
      const tutorialQuery = `
        SELECT t.*, c.department_id, ci.instructor_id as assigned_instructor
        FROM tutorials t
        LEFT JOIN courses c ON t.course_id = c.id
        LEFT JOIN course_instructors ci ON c.id = ci.course_id AND ci.is_active = true
        WHERE t.id = $1
      `;
      
      const tutorialResult = await pool.query(tutorialQuery, [tutorialId]);
      
      if (tutorialResult.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Tutorial not found'
        });
      }

      // Check permissions
      if (userRole === 'instructor') {
        const isAssigned = tutorialResult.rows.some(row => row.assigned_instructor === uploadedBy);
        if (!isAssigned) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'You can only add videos to tutorials for courses you are assigned to'
          });
        }
      } else if (userRole === 'department_head') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Department heads cannot add tutorial videos. Only instructors can add materials.'
        });
      } else if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only instructors and admins can add tutorial videos'
        });
      }

      // Save video link to database
      const insertQuery = `
        INSERT INTO tutorial_files (
          tutorial_id, file_name, file_type, video_url, video_type, is_external,
          uploaded_by, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        tutorialId,
        title,
        'video',
        video_url,
        video_type,
        true,
        uploadedBy,
        `External video link (${video_type})`
      ];

      console.log('Insert query values:', values);
      const result = await pool.query(insertQuery, values);
      console.log('Insert result:', result.rows[0]);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Video link added successfully',
        file: result.rows[0]
      });

    } catch (error) {
      console.error('Add video link error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get tutorial files (All authenticated users)
   */
  static getTutorialFiles = async (req, res) => {
    try {
      const { tutorialId } = req.params;
      const userRole = req.user.role;

      // Get tutorial files with uploader info
      const query = `
        SELECT 
          tf.*,
          u.full_name as uploaded_by_name,
          r.name as uploader_role
        FROM tutorial_files tf
        LEFT JOIN users u ON tf.uploaded_by = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE tf.tutorial_id = $1 AND tf.is_active = true
        ORDER BY tf.upload_date DESC
      `;

      const result = await pool.query(query, [tutorialId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        files: result.rows
      });

    } catch (error) {
      console.error('Get tutorial files error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get tutorial videos (All authenticated users)
   */
  static getTutorialVideos = async (req, res) => {
    try {
      const { tutorialId } = req.params;

      const query = `
        SELECT 
          tv.*,
          u.full_name as uploaded_by_name,
          r.name as uploader_role
        FROM tutorial_videos tv
        LEFT JOIN users u ON tv.uploaded_by = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE tv.tutorial_id = $1 AND tv.is_active = true
        ORDER BY tv.upload_date DESC
      `;

      const result = await pool.query(query, [tutorialId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        videos: result.rows
      });

    } catch (error) {
      console.error('Get tutorial videos error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Delete tutorial file (Instructor/Admin only - own files)
   */
  static deleteFile = async (req, res) => {
    try {
      const { fileId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get file info
      const fileQuery = `
        SELECT tf.*, t.course_id, ci.instructor_id as assigned_instructor
        FROM tutorial_files tf
        LEFT JOIN tutorials t ON tf.tutorial_id = t.id
        LEFT JOIN course_instructors ci ON t.course_id = ci.course_id AND ci.is_active = true
        WHERE tf.id = $1
      `;

      const fileResult = await pool.query(fileQuery, [fileId]);

      if (fileResult.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'File not found'
        });
      }

      const file = fileResult.rows[0];

      // Check permissions
      if (userRole === 'instructor') {
        // Instructor can only delete their own files or files from their assigned courses
        const canDelete = file.uploaded_by === userId || 
                         fileResult.rows.some(row => row.assigned_instructor === userId);
        if (!canDelete) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: 'You can only delete your own files or files from courses you are assigned to'
          });
        }
      } else if (userRole === 'department_head') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Department heads cannot delete tutorial files'
        });
      } else if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Insufficient permissions to delete files'
        });
      }

      // Soft delete (mark as inactive)
      await pool.query(
        'UPDATE tutorial_files SET is_active = false WHERE id = $1',
        [fileId]
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete file error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Get course materials overview (Department Head - Read Only)
   */
  static getCourseMaterialsOverview = async (req, res) => {
    try {
      const userRole = req.user.role;
      const departmentId = req.departmentId; // Set by verifyDepartmentHeadAccess middleware

      if (userRole !== 'department_head') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only department heads can access this overview'
        });
      }

      const query = `
        SELECT 
          c.id as course_id,
          c.title as course_title,
          c.code as course_code,
          COUNT(DISTINCT t.id) as tutorial_count,
          COUNT(DISTINCT tf.id) as file_count,
          COUNT(DISTINCT tv.id) as video_count,
          u.full_name as instructor_name
        FROM courses c
        LEFT JOIN tutorials t ON c.id = t.course_id AND t.is_published = true
        LEFT JOIN tutorial_files tf ON t.id = tf.tutorial_id AND tf.is_active = true
        LEFT JOIN tutorial_videos tv ON t.id = tv.tutorial_id AND tv.is_active = true
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.department_id = $1 AND c.is_active = true
        GROUP BY c.id, c.title, c.code, u.full_name
        ORDER BY c.title
      `;

      const result = await pool.query(query, [departmentId]);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        courses: result.rows
      });

    } catch (error) {
      console.error('Get course materials overview error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };

  /**
   * Download file (All authenticated users)
   */
  static downloadFile = async (req, res) => {
    try {
      const { fileId } = req.params;

      // Get file info
      const query = 'SELECT * FROM tutorial_files WHERE id = $1 AND is_active = true';
      const result = await pool.query(query, [fileId]);

      if (result.rows.length === 0) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'File not found'
        });
      }

      const file = result.rows[0];

      // Check if it's an external link (video URL without file path)
      if (file.is_external || !file.file_path) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'External video links cannot be downloaded. Please visit the video source directly.'
        });
      }

      // Increment download count
      await pool.query(
        'UPDATE tutorial_files SET download_count = download_count + 1 WHERE id = $1',
        [fileId]
      );

      // Send file
      res.download(file.file_path, file.file_name);

    } catch (error) {
      console.error('Download file error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR
      });
    }
  };
}

export default TutorialFilesController;
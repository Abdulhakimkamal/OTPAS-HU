/**
 * Project Controller
 * Handles HTTP requests for project title submission and approval workflow
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.8
 */

import ProjectService from '../services/project.service.js';
import FileUploadService from '../services/file-upload.service.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

class ProjectController {
  /**
   * Request title submissions from students
   * POST /api/instructor/project/request-title
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async requestTitle(req, res, next) {
    try {
      const instructorId = req.user.id;
      const { student_ids } = req.body;

      await ProjectService.requestTitleSubmission(instructorId, student_ids);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Title submission requests sent successfully',
        data: {
          instructor_id: instructorId,
          student_count: student_ids.length
        }
      });
    } catch (error) {
      console.error('Request title error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not assigned')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Approve project title
   * PATCH /api/instructor/project/:id/approve
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async approveTitle(req, res, next) {
    try {
      const instructorId = req.user.id;
      const projectId = parseInt(req.params.id);

      const project = await ProjectService.approveTitle(projectId, instructorId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project title approved successfully',
        data: project
      });
    } catch (error) {
      console.error('Approve title error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('not assigned') || error.message.includes('not in pending status')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Disapprove project title
   * PATCH /api/instructor/project/:id/disapprove
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async disapproveTitle(req, res, next) {
    try {
      const instructorId = req.user.id;
      const projectId = parseInt(req.params.id);
      const { reason } = req.body;

      const project = await ProjectService.disapproveTitle(projectId, instructorId, reason);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project title rejected successfully',
        data: project
      });
    } catch (error) {
      console.error('Disapprove title error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('not assigned') || error.message.includes('not in pending status')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get pending projects for instructor
   * GET /api/instructor/projects/pending
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getPendingProjects(req, res, next) {
    try {
      const instructorId = req.user.id;

      const projects = await ProjectService.getPendingProjects(instructorId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Pending projects retrieved successfully',
        data: {
          projects,
          count: projects.length
        }
      });
    } catch (error) {
      console.error('Get pending projects error:', error);
      
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all projects for instructor (pending, approved, rejected)
   * GET /api/instructor/projects
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getInstructorProjects(req, res, next) {
    try {
      const instructorId = req.user.id;

      const projects = await ProjectService.getInstructorProjects(instructorId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Instructor projects retrieved successfully',
        data: {
          projects,
          count: projects.length
        }
      });
    } catch (error) {
      console.error('Get instructor projects error:', error);
      
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Submit project title (student)
   * POST /api/student/project/title
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async submitTitle(req, res, next) {
    try {
      const studentId = req.user.id;
      const { instructor_id, title, description } = req.body;

      const project = await ProjectService.submitTitle(
        studentId,
        instructor_id,
        title,
        description
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Project title submitted successfully',
        data: project
      });
    } catch (error) {
      console.error('Submit title error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not assigned')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get project status (student)
   * GET /api/student/project/:id/status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getStatus(req, res, next) {
    try {
      const studentId = req.user.id;
      const projectId = parseInt(req.params.id);

      const projectStatus = await ProjectService.getProjectStatus(projectId, studentId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Project status retrieved successfully',
        data: projectStatus
      });
    } catch (error) {
      console.error('Get project status error:', error);
      
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('does not own')) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: error.message
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_ERROR,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }


   /**
    * Upload project file (student)
    * POST /api/student/project/:id/upload
    * @param {Object} req - Express request object
    * @param {Object} res - Express response object
    * @param {Function} next - Express next middleware function
    */
   static async uploadFile(req, res, next) {
     try {
       const studentId = req.user.id;
       const projectId = parseInt(req.params.id);

       // Validate file was uploaded
       if (!req.file) {
         return res.status(HTTP_STATUS.BAD_REQUEST).json({
           success: false,
           message: 'No file provided'
         });
       }

       // Validate file type
       if (!FileUploadService.isFileTypeAllowed(req.file.mimetype)) {
         return res.status(HTTP_STATUS.BAD_REQUEST).json({
           success: false,
           message: `File type ${req.file.mimetype} is not allowed`
         });
       }

       // Validate file size
       if (!FileUploadService.isFileSizeValid(req.file.size)) {
         return res.status(HTTP_STATUS.BAD_REQUEST).json({
           success: false,
           message: `File size exceeds maximum limit of 50MB`
         });
       }

       // Upload file
       const fileMetadata = await FileUploadService.uploadProjectFile(
         projectId,
         studentId,
         req.file
       );

       res.status(HTTP_STATUS.CREATED).json({
         success: true,
         message: 'File uploaded successfully',
         data: {
           ...fileMetadata,
           file_size_formatted: FileUploadService.formatFileSize(fileMetadata.file_size)
         }
       });
     } catch (error) {
       console.error('Upload file error:', error);

       // Handle specific error cases
       if (error.message.includes('not found')) {
         return res.status(HTTP_STATUS.NOT_FOUND).json({
           success: false,
           message: error.message
         });
       }

       if (error.message.includes('does not own') || error.message.includes('Cannot upload')) {
         return res.status(HTTP_STATUS.FORBIDDEN).json({
           success: false,
           message: error.message
         });
       }

       res.status(HTTP_STATUS.INTERNAL_ERROR).json({
         success: false,
         message: ERROR_MESSAGES.DATABASE_ERROR,
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
       });
     }
   }

   /**
    * Get project files (student)
    * GET /api/student/project/:id/files
    * @param {Object} req - Express request object
    * @param {Object} res - Express response object
    * @param {Function} next - Express next middleware function
    */
   static async getProjectFiles(req, res, next) {
     try {
       const studentId = req.user.id;
       const projectId = parseInt(req.params.id);

       // Verify student owns the project
       const project = await ProjectService.getProjectStatus(projectId, studentId);

       // Get files
       const files = await FileUploadService.getProjectFiles(projectId);
       const stats = await FileUploadService.getProjectFileStats(projectId);

       res.status(HTTP_STATUS.OK).json({
         success: true,
         message: 'Project files retrieved successfully',
         data: {
           files: files.map(f => ({
             ...f,
             file_size_formatted: FileUploadService.formatFileSize(f.file_size)
           })),
           stats
         }
       });
     } catch (error) {
       console.error('Get project files error:', error);

       if (error.message.includes('not found')) {
         return res.status(HTTP_STATUS.NOT_FOUND).json({
           success: false,
           message: error.message
         });
       }

       if (error.message.includes('does not own')) {
         return res.status(HTTP_STATUS.FORBIDDEN).json({
           success: false,
           message: error.message
         });
       }

       res.status(HTTP_STATUS.INTERNAL_ERROR).json({
         success: false,
         message: ERROR_MESSAGES.DATABASE_ERROR,
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
       });
     }
   }

   /**
    * Delete project file (student)
    * DELETE /api/student/project/file/:id
    * @param {Object} req - Express request object
    * @param {Object} res - Express response object
    * @param {Function} next - Express next middleware function
    */
   static async deleteFile(req, res, next) {
     try {
       const studentId = req.user.id;
       const fileId = parseInt(req.params.id);

       // Delete file
       const deletedFile = await FileUploadService.deleteFile(fileId, studentId, true);

       res.status(HTTP_STATUS.OK).json({
         success: true,
         message: 'File deleted successfully',
         data: deletedFile
       });
     } catch (error) {
       console.error('Delete file error:', error);

       if (error.message.includes('not found')) {
         return res.status(HTTP_STATUS.NOT_FOUND).json({
           success: false,
           message: error.message
         });
       }

       if (error.message.includes('Unauthorized')) {
         return res.status(HTTP_STATUS.FORBIDDEN).json({
           success: false,
           message: error.message
         });
       }

       res.status(HTTP_STATUS.INTERNAL_ERROR).json({
         success: false,
         message: ERROR_MESSAGES.DATABASE_ERROR,
         error: process.env.NODE_ENV === 'development' ? error.message : undefined
       });
     }
   }

}

export default ProjectController;

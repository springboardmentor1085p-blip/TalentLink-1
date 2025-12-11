// frontend/src/api/savedItems.js
import client from './client';

export const savedItemsAPI = {
  // Projects
  saveProject: (projectId) => client.post('/saved-items/projects/', { project_id: projectId }),
  unsaveProject: (projectId) => client.delete(`/saved-items/projects/${projectId}/`),
  getSavedProjects: () => client.get('/saved-items/projects/'),
  isProjectSaved: (projectId) => client.get(`/saved-items/projects/${projectId}/check/`),
  
  // Jobs
  saveJob: (jobId) => client.post('/saved-items/jobs/', { job_id: jobId }),
  unsaveJob: (jobId) => client.delete(`/saved-items/jobs/${jobId}/`),
  getSavedJobs: () => client.get('/saved-items/jobs/'),
  isJobSaved: (jobId) => client.get(`/saved-items/jobs/${jobId}/check/`),
};
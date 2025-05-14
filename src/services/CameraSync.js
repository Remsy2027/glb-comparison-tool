// CameraSync.js - Comprehensive real-time camera synchronization

export class CameraSync {
  static viewers = new Map();
  static isSyncing = false;

  static registerViewer(viewerObj, id) {
    this.viewers.set(id, viewerObj);
    console.log(`Viewer ${id} registered for sync. Total viewers:`, this.viewers.size);
  }

  static unregisterViewer(id) {
    this.viewers.delete(id);
    console.log(`Viewer ${id} unregistered from sync. Remaining:`, this.viewers.size);
  }

  static syncFromSource(sourceId) {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    const sourceViewer = this.viewers.get(sourceId);
    if (!sourceViewer) {
      this.isSyncing = false;
      return;
    }

    const sourceCamera = sourceViewer.getCamera();
    const sourceControls = sourceViewer.getControls();
    
    if (!sourceCamera || !sourceControls) {
      this.isSyncing = false;
      return;
    }

    // Get all source values
    const sourceValues = {
      position: sourceCamera.position.clone(),
      quaternion: sourceCamera.quaternion.clone(),
      fov: sourceCamera.fov,
      zoom: sourceCamera.zoom,
      target: sourceControls.target.clone(),
      // Also sync additional control properties
      distance: sourceCamera.position.distanceTo(sourceControls.target),
      spherical: {
        radius: sourceCamera.position.distanceTo(sourceControls.target),
        phi: Math.acos(Math.max(-1, Math.min(1, 
          (sourceCamera.position.y - sourceControls.target.y) / 
          sourceCamera.position.distanceTo(sourceControls.target)
        ))),
        theta: Math.atan2(
          sourceCamera.position.x - sourceControls.target.x,
          sourceCamera.position.z - sourceControls.target.z
        )
      }
    };

    // Sync to all other viewers
    this.viewers.forEach((targetViewer, targetId) => {
      if (targetId === sourceId) return;
      
      const targetCamera = targetViewer.getCamera();
      const targetControls = targetViewer.getControls();
      
      if (!targetCamera || !targetControls) return;
      
      // Disable target controls to prevent recursion
      const wasEnabled = targetControls.enabled;
      targetControls.enabled = false;
      
      // Copy all camera and control properties
      targetCamera.position.copy(sourceValues.position);
      targetCamera.quaternion.copy(sourceValues.quaternion);
      targetCamera.fov = sourceValues.fov;
      targetCamera.zoom = sourceValues.zoom;
      
      // Sync the target (pan)
      targetControls.target.copy(sourceValues.target);
      
      // Update camera and controls
      targetCamera.updateProjectionMatrix();
      targetCamera.updateMatrixWorld();
      targetControls.update();
      
      // Re-enable controls after sync
      setTimeout(() => {
        if (wasEnabled) {
          targetControls.enabled = true;
        }
      }, 5);
    });
    
    setTimeout(() => {
      this.isSyncing = false;
    }, 10);
  }

  static resetAllCameras(referenceCamera, referenceControls) {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    // Store reference values
    const refValues = {
      position: referenceCamera.position.clone(),
      quaternion: referenceCamera.quaternion.clone(),
      fov: referenceCamera.fov,
      zoom: referenceCamera.zoom,
      target: referenceControls.target.clone()
    };
    
    // Reset all viewers to reference values
    this.viewers.forEach((viewer, id) => {
      const camera = viewer.getCamera();
      const controls = viewer.getControls();
      
      if (!camera || !controls) return;
      
      // Disable controls temporarily
      const wasEnabled = controls.enabled;
      controls.enabled = false;
      
      // Copy all reference values
      camera.position.copy(refValues.position);
      camera.quaternion.copy(refValues.quaternion);
      camera.fov = refValues.fov;
      camera.zoom = refValues.zoom;
      
      // Reset target (pan)
      controls.target.copy(refValues.target);
      
      // Update everything
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      controls.update();
      
      // Re-enable controls
      setTimeout(() => {
        if (wasEnabled) {
          controls.enabled = true;
        }
      }, 10);
    });
    
    setTimeout(() => {
      this.isSyncing = false;
    }, 50);
  }
}
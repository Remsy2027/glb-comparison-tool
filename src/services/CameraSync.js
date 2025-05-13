export class CameraSync {
    static isEnabled = false;
    static viewers = [];
    static isSyncing = false;
  
    static enable() {
      this.isEnabled = true;
      console.log('Camera sync enabled');
    }
  
    static disable() {
      this.isEnabled = false;
      console.log('Camera sync disabled');
    }
  
    static registerViewer(viewer, id) {
      this.viewers.push({ viewer, id });
      console.log(`Viewer ${id} registered for sync`);
    }
  
    static unregisterViewer(id) {
      this.viewers = this.viewers.filter(v => v.id !== id);
      console.log(`Viewer ${id} unregistered from sync`);
    }
  
    static syncCameraFromSource(sourceId, targetId) {
      if (!this.isEnabled || this.isSyncing) return;
      
      this.isSyncing = true;
      
      const sourceViewer = this.viewers.find(v => v.id === sourceId)?.viewer;
      const targetViewer = this.viewers.find(v => v.id === targetId)?.viewer;
      
      if (!sourceViewer || !targetViewer) {
        this.isSyncing = false;
        return;
      }
  
      const sourceCamera = sourceViewer.getCamera();
      const targetCamera = targetViewer.getCamera();
      const sourceControls = sourceViewer.getControls();
      const targetControls = targetViewer.getControls();
  
      if (!sourceCamera || !targetCamera || !sourceControls || !targetControls) {
        this.isSyncing = false;
        return;
      }
  
      // Temporarily disable target controls to prevent recursion
      targetControls.enabled = false;
  
      // Sync all camera properties
      targetCamera.position.copy(sourceCamera.position);
      targetCamera.quaternion.copy(sourceCamera.quaternion);
      targetCamera.fov = sourceCamera.fov;
      targetCamera.updateProjectionMatrix();
      targetCamera.updateMatrixWorld();
  
      // Sync controls target
      targetControls.target.copy(sourceControls.target);
      targetControls.update();
  
      // Re-enable controls after a short delay
      setTimeout(() => {
        targetControls.enabled = true;
        this.isSyncing = false;
      }, 10);
    }
  
    static syncAllFromSource(sourceId) {
      this.viewers.forEach(viewer => {
        if (viewer.id !== sourceId) {
          this.syncCameraFromSource(sourceId, viewer.id);
        }
      });
    }
  }
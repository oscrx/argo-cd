-- https://stackgres.io/doc/latest/reference/crd/sgshardedbackup/#sgshardedbackupstatus
-- https://github.com/ongres/stackgres/blob/47cf40af2ab183a6dee05089552801a31dcf927e/stackgres-k8s/src/common/src/main/java/io/stackgres/common/crd/sgshardedbackup/ShardedBackupStatus.java#L15
local hs = {
  status = "Progressing",
  message = "Unknown status"
}
if obj.status ~= nil then
  if obj.status.process ~= nil then
    if obj.status.process.status == "Pending" then
      hs.status = "Progressing"
      hs.message = "Backup is not yet started"
      return hs
    end
    if obj.status.process.status == "Running" then
      hs.status = "Progressing"
      hs.message = "Backup is running"
      return hs
    end
    if obj.status.process.status == "Failed" then
      hs.status = "Degraded"
      hs.message = obj.status.process.failure
      return hs
    end
    if obj.status.process.status == "Completed" then
      hs.status = "Healthy"
      hs.message = "Backup completed"
      return hs
    end
  end
end
return hs

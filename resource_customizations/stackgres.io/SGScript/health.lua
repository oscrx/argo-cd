-- https://stackgres.io/doc/latest/reference/crd/sgscript/#sgscriptstatus
-- https://github.com/ongres/stackgres/blob/47cf40af2ab183a6dee05089552801a31dcf927e/stackgres-k8s/src/common/src/main/java/io/stackgres/common/crd/sgscript/StackGresScriptStatus.java#L52
local hs = {
  status = "Progressing",
  message = "Unknown status"
}
if obj.status ~= nil then
  if obj.status.scripts ~= nil then
    hs.status = "Healthy"
    hs.message = "Scripts loaded"
    return hs
  end
end
return hs

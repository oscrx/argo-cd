-- https://stackgres.io/doc/latest/reference/crd/sgpoolingconfig/#sgpoolingconfigstatus
-- https://github.com/ongres/stackgres/blob/47cf40af2ab183a6dee05089552801a31dcf927e/stackgres-k8s/src/common/src/main/java/io/stackgres/common/crd/sgpooling/StackGresPoolingConfigStatus.java#L50
local hs = {
  status = "Progressing",
  message = "Unknown status"
}
if obj.status ~= nil then
  if obj.status.pgBouncer ~= nil then
    hs.status = "Healthy"
    hs.message = "Config loaded"
    return hs
  end
end
return hs

-- https://stackgres.io/doc/latest/reference/crd/sgconfig/#sgconfigstatus
-- https://github.com/ongres/stackgres/blob/47cf40af2ab183a6dee05089552801a31dcf927e/stackgres-k8s/src/common/src/main/java/io/stackgres/common/crd/sgconfig/ConfigStatusCondition.java#L12
local hs = {
  status = "Progressing",
  message = "Unknown status"
}
if obj.status ~= nil then
  if obj.status.conditions ~= nil then
    for i, condition in ipairs(obj.status.conditions) do
      if condition.type == "Failed" and condition.status == "True" then
        hs.status = "Degraded"
        hs.message = condition.reason
        return hs
      end
    end
    hs.status = "Healthy"
    hs.message = "No errors reported"
    return hs
  end
end
return hs

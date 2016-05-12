# Object API - Overview

The object API provides methods for fetching domain objects.


### MCT.objects.get(namespace, identifier)

namespace, name, id (unique combination of namespace + name)

### MCT.objects.Provider

provider.matchNamespace(namespace)
provider.get(id)
provider.save(domainObject)
provider.delete(domainObject)


### MCT.objects.save(domainObject)
    Create, or 
    
### MCT.objects.delete(id)
    Delete an object by specifying id
### MCT.objects.delete(domainObject)
    Delete an objects by specifying domain object
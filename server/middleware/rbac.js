/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces SCRUM-36: Citizen, Coordinator, Volunteer, Donor, Authority, Admin
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    // Admin has super-access across operational routes
    if (userRole === 'Admin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access forbidden: Role '${userRole}' is not authorized to access this resource. Allowed roles: ${allowedRoles.join(', ')}`
    });
  };
}

module.exports = {
  requireRoles
};

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error caught by middleware:', err.message);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // MySQL specific error code mappings
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        statusCode = 409;
        message = 'Cannot delete or alter this record because related transaction records depend on it.';
    } else if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 400;
        message = 'A record with this unique identifier or name already exists.';
    } else if (err.code === 'ECONNREFUSED') {
        statusCode = 500;
        message = 'Database connection failure. The MySQL service may be offline.';
    }

    res.status(statusCode).json({
        success: false,
        message,
        error: {
            message,
            status: statusCode,
            code: err.code || null
        }
    });
};

module.exports = { errorHandler };

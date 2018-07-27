// Response helper;
const responseHelper = {
    // Response data;
    responseData: { 'status': 'success' },

    // Function for updating response with success;
    setResponseSuccess: function()
    {
        this.responseData = { status: 'success' };
    },

    // Function for updating response with error;
    setResponseError: function(error)
    {
        this.responseData = { status: 'error', message: error };
    },

    // Function for updating response data;
    setResponseData: function(data)
    {
        this.responseData = { status: 'success', data: data };
    },

    // Function for sending responseData to response;
    sendResponse: function(response)
    {
        response.json(this.responseData);
    }
};

// Export response helper;
module.exports = responseHelper;
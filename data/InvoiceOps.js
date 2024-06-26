const Invoice = require("../models/Invoice.js");

class InvoiceOps {
  // empty constructor
  InvoiceOps() {}


  async getAllInvoices(filter = {}) {
    console.log("Getting all invoices with filter:", filter);
    
    let invoices = await Invoice.find(filter)
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ invoiceNumber: 1 });
  
    return invoices;
  }
  

  async getInvoiceById(id) {
    console.log(`getting invoice by id ${id}`);
    let invoice = await Invoice.findById(id);
    return invoice;
  }

  async createInvoice(invoiceObj) {
    try {
      console.log("ccreate new invoice!!",invoiceObj)
      const error = await invoiceObj.validateSync();
      if (error) {
        const response = {
          obj: invoiceObj,
          errorMsg: error.message,
        };
        return response; // Exit if the model is invalid
      }

      // Model is valid, so save it
      const result = await invoiceObj.save();
      const response = {
        obj: result,
        errorMsg: "",
      };
      return response;
    } catch (error) {
      const response = {
        obj: invoiceObj,
        errorMsg: error.message,
      };
      return response;
    }
  }
  async deleteInvoiceById(id) {
    console.log(`deleting invoice by id ${id}`);
    let result = await Invoice.findByIdAndDelete(id);
    console.log(result);
    return result;
  }

  async togglePaidStatusById(id) {
    try {
      console.log(`Toggling paid status for invoice with id ${id}`);
      const invoice = await Invoice.findById(id);
      if (invoice) {
        invoice.paid = !invoice.paid; // Toggle the 'paid' status
        const updatedInvoice = await invoice.save();
        return updatedInvoice;
      } else {
        return null; // Invoice not found
      }
    } catch (error) {
      console.error("Error toggling paid status:", error);
      throw error;
    }
  }
  
/*
  async updateInvoiceById(id, clientName, clientCode, companyName, email) {
    console.log(`updating invoice by id ${id}`);
    const invoice = await Invoice.findById(id);
    console.log("original invoice: ", invoice);
    client.name = clientName;
    client.code = clientCode;
    client.companyName = companyName;
    client.email = email;

    let result = await client.save();
    console.log("updated client: ", result);
    return {
      obj: result,
      errorMsg: "",
    };
  }*/
}

module.exports = InvoiceOps;

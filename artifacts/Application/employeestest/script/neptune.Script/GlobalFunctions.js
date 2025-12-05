// Global Models
var appModel;
var oEmployeeDetailsModel;

// Initialize the application
function initializeApp() {
    appModel = new sap.ui.model.json.JSONModel({
        currentEmployeeId: null
    });
    oEmployeeDetailsModel = new sap.ui.model.json.JSONModel({});

    if (typeof App !== 'undefined') {
        App.setModel(appModel, "appModel");
    }

    configureResponsiveTables();
    onInitPage(); // Load initial data
}

function onInitPage() {
    loadEmployeeData();
}

function loadEmployeeData() {
    sap.ui.core.BusyIndicator.show(0);
    apigetAllEmployees()
        .success(function(data) {
            // Data is automatically bound to the table by the framework
            sap.m.MessageToast.show("Employees loaded successfully.");
            sap.ui.core.BusyIndicator.hide();
        })
        .error(function(err) {
            sap.m.MessageBox.error("Failed to load employees.");
            sap.ui.core.BusyIndicator.hide();
        });
}

function configureResponsiveTables() {
    if (typeof oEmployees !== "undefined") {
        oEmployees.getColumns().forEach(function(column, index) {
            switch (index) {
                case 0: // First Name
                case 1: // Last Name
                    column.setMinScreenWidth("Phone");
                    column.setDemandPopin(false);
                    break;
                case 2: // Email
                case 3: // Department
                    column.setMinScreenWidth("Tablet");
                    column.setDemandPopin(true);
                    column.setPopinDisplay("Inline");
                    break;
                case 4: // Actions
                    column.setMinScreenWidth("Phone");
                    column.setDemandPopin(false);
                    break;
                default:
                    column.setMinScreenWidth("Desktop");
                    column.setDemandPopin(true);
                    break;
            }
        });
    }
}

// Handle press on an employee item to see details
// This function should be assigned to the 'itemPress' event of the oEmployees table
function onEmployeeItemPress(oEvent) {
    const context = oEvent.getParameter("listItem").getBindingContext();
    if (context) {
        const employeeData = context.getObject();
        oEmployeeDetailsModel.setData(employeeData);
        if (typeof displayEmployeeDetails !== 'undefined') {
            displayEmployeeDetails.setModel(oEmployeeDetailsModel);
        }
        if (typeof App !== 'undefined' && typeof oEmployeeDetailsPage !== 'undefined') {
            App.to(oEmployeeDetailsPage);
        }
    }
}

// Handle press on the 'Edit' button in a table row
function onEditEmployee(oEvent) {
    const employeeData = oEvent.getSource().getBindingContext().getObject();
    
    appModel.setProperty("/currentEmployeeId", employeeData.id);

    if (typeof inaddEmployeeFormFirstName !== 'undefined') inaddEmployeeFormFirstName.setValue(employeeData.FirstName);
    if (typeof inaddEmployeeFormLastName !== 'undefined') inaddEmployeeFormLastName.setValue(employeeData.LastName);
    if (typeof inaddEmployeeFormEmail !== 'undefined') inaddEmployeeFormEmail.setValue(employeeData.Email);
    if (typeof inaddEmployeeFormDepartment !== 'undefined') inaddEmployeeFormDepartment.setValue(employeeData.Department);
    if (typeof inaddEmployeeFormContact !== 'undefined') inaddEmployeeFormContact.setValue(employeeData.Contact);
    if (typeof inaddEmployeeFormAddress !== 'undefined') inaddEmployeeFormAddress.setValue(employeeData.Address);
    if (typeof inaddEmployeeFormProject !== 'undefined') inaddEmployeeFormProject.setValue(employeeData.Project);

    if (typeof addPageTitle !== 'undefined') addPageTitle.setText("Edit Employee");
    if (typeof App !== 'undefined' && typeof addEmployeePage !== 'undefined') App.to(addEmployeePage);
}

function onDeleteEmployee(oEvent) {
    const employeeData = oEvent.getSource().getBindingContext().getObject();
    const employeeName = employeeData.FirstName + " " + employeeData.LastName;
    const id = employeeData.id;

    sap.m.MessageBox.confirm("Are you sure you want to delete employee '" + employeeName + "'?", {
        title: "Confirm Deletion",
        onClose: function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                sap.ui.core.BusyIndicator.show(0);

                var options = {
                    parameters: {
                        where: JSON.stringify({ id: id })
                    }
                };

                apideleteEmployee(options)
                    .success(function(data) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageToast.show("Employee '" + employeeName + "' deleted successfully.");
                        loadEmployeeData();
                    })
                    .error(function(err) {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageBox.error("Failed to delete employee. Please try again.");
                    });
            }
        }
    });
}

// Navigate to the Add Employee page
function navigateToAddEmployee() {
    appModel.setProperty("/currentEmployeeId", null);

    if (typeof inaddEmployeeFormFirstName !== 'undefined') inaddEmployeeFormFirstName.setValue("");
    if (typeof inaddEmployeeFormLastName !== 'undefined') inaddEmployeeFormLastName.setValue("");
    if (typeof inaddEmployeeFormEmail !== 'undefined') inaddEmployeeFormEmail.setValue("");
    if (typeof inaddEmployeeFormDepartment !== 'undefined') inaddEmployeeFormDepartment.setValue("");
    if (typeof inaddEmployeeFormContact !== 'undefined') inaddEmployeeFormContact.setValue("");
    if (typeof inaddEmployeeFormAddress !== 'undefined') inaddEmployeeFormAddress.setValue("");
    if (typeof inaddEmployeeFormProject !== 'undefined') inaddEmployeeFormProject.setValue("");
    
    if (typeof addPageTitle !== 'undefined') addPageTitle.setText("Add New Employee");
    if (typeof App !== 'undefined' && typeof addEmployeePage !== 'undefined') App.to(addEmployeePage);
}

function navigateBack() {
    if (typeof App !== 'undefined') {
        App.back();
    }
}

function handleSaveEmployee() {
    const employeeId = appModel.getProperty("/currentEmployeeId");
    const isEdit = !!employeeId;

    const employeeData = {
        FirstName: inaddEmployeeFormFirstName.getValue(),
        LastName: inaddEmployeeFormLastName.getValue(),
        Email: inaddEmployeeFormEmail.getValue(),
        Department: inaddEmployeeFormDepartment.getValue(),
        Contact: inaddEmployeeFormContact.getValue(),
        Address: inaddEmployeeFormAddress.getValue(),
        Project: inaddEmployeeFormProject.getValue()
    };

    if (!employeeData.FirstName || !employeeData.Email) {
        sap.m.MessageBox.error("First Name and Email are required.");
        return;
    }

    if (isEdit) {
        employeeData.id = employeeId;
    }
    
    const contactValue = parseInt(employeeData.Contact, 10);
    if (!isNaN(contactValue)) {
        employeeData.Contact = contactValue;
    } 

    sap.ui.core.BusyIndicator.show(0);

    var options = {
        data: employeeData
    };

    apiupdateEmployee(options)
        .success(function(data) {
            sap.ui.core.BusyIndicator.hide();
            const actionText = isEdit ? "updated" : "created";
            sap.m.MessageToast.show("Employee successfully " + actionText + ".");
            loadEmployeeData();
            navigateBack();
        })
        .error(function(err) {
            sap.ui.core.BusyIndicator.hide();
            sap.m.MessageBox.error("Failed to save employee data. Please try again.");
        });
}

initializeApp();
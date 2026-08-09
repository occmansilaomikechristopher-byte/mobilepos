import SQLite from 'react-native-sqlite-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = 'payroll.pos';

let db;
let dbPromise;

const initDatabase = () => {
    if (db) {
        return Promise.resolve(db);
    }

    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = SQLite.openDatabase({
        name: database_name,
        location: 'default',
    })
        .then(DB => {
            db = DB;
            console.log('Database OPEN');
            db.transaction(tx => {
                // Create Departments table
                // tx.executeSql(
                //     `CREATE TABLE IF NOT EXISTS Departments (
                //   id INTEGER PRIMARY KEY NOT NULL,
                //   name TEXT
                // );`,
                //     [],
                //     () => {
                //         console.log('Departments table created successfully');
                //     },
                //     (tx, error) => {
                //         console.error(
                //             'Error creating Departments table:',
                //             error,
                //         );
                //     },
                // );

                // Create Positions table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS Positions (
                  id INTEGER PRIMARY KEY NOT NULL,
                  name TEXT
                );`,
                    [],
                    () => {
                        console.log('Positions table created successfully');
                    },
                    (tx, error) => {
                        console.error('Error creating Positions table:', error);
                    },
                );

                // Create Employee table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS Employee (
                  id INTEGER PRIMARY KEY NOT NULL,
                  firstname TEXT,
                  middlename TEXT,
                  lastname TEXT,
                  employee_no TEXT,
                  position_id INTEGER,
                  position TEXT,
                  estatus TEXT NOT NULL,
                  weekly_payroll TEXT NOT NULL
                );`,
                    [],
                    () => {
                        console.log('Employee table created successfully');
                    },
                    (tx, error) => {
                        console.error('Error creating Employee table:', error);
                    },
                );

                // Create DTR table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS DTR (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  date_from TEXT NOT NULL,
                  date_to TEXT NOT NULL,
                  device_id INTEGER NOT NULL,
                  site_id INTEGER DEFAULT 1,
                  file TEXT NOT NULL,
                  isCheck INTEGER DEFAULT 0 NOT NULL,
                  status TEXT NOT NULL,
                  weekly_payroll TEXT NOT NULL
                );`,
                    [],
                    () => {
                        console.log('DTR table created successfully');
                    },
                    (tx, error) => {
                        console.error('Error creating DTR table:', error);
                    },
                );

                // Create DTR_details table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS DTR_details (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  dtr_id INTEGER NOT NULL,
                  employee_id INTEGER NOT NULL,
                  date_time TEXT NOT NULL,
                  hours INTEGER NOT NULL,
                  ot INTEGER NOT NULL,
                  ei INTEGER NOT NULL,
                  logs TEXT NOT NULL,
                  type TEXT NOT NULL,
                  notes TEXT  NULL,
                  isCheck INTEGER DEFAULT 0 NOT NULL,
                  FOREIGN KEY (dtr_id) REFERENCES DTR(id)  ON DELETE CASCADE,
                  FOREIGN KEY (employee_id) REFERENCES Employee(id)  ON DELETE CASCADE
                );`,
                    [],
                    () => {
                        console.log('DTR_details table created successfully');
                    },
                    (tx, error) => {
                        console.error(
                            'Error creating DTR_details table:',
                            error,
                        );
                    },
                );

                // Create My Employee table
                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS MyEmployee (
                  id INTEGER PRIMARY KEY NOT NULL,
                                    code TEXT NOT NULL,
                  site_id INTEGER DEFAULT 1,
                  UNIQUE (id)
                );`,
                    [],
                    () => {
                        console.log(' MY Employee table created successfully');
                    },
                    (tx, error) => {
                        console.error(
                            'Error creating MY  Employee table:',
                            error,
                        );
                    },
                );

                tx.executeSql(
                    `CREATE TABLE IF NOT EXISTS VisitorLogs (
                  id INTEGER PRIMARY KEY NOT NULL,
                  image TEXT NOT NULL,
                  name TEXT ,
                  company TEXT ,
                  date_visited TIMESTAMP NULL,
                  UNIQUE (id) 
                );`,
                    [],
                    () => {
                        console.log(' MY Employee table created successfully');
                    },
                    (tx, error) => {
                        console.error(
                            'Error creating MY  Employee table:',
                            error,
                        );
                    },
                );
            });
            return db;
        })
        .catch(error => {
            dbPromise = undefined;
            console.error('Database initialization failed:', error);
            throw error;
        });

    return dbPromise;
};

const getDatabase = async () => {
    const database = db || (await initDatabase());
    if (!database) {
        throw new Error('Database is not initialized');
    }
    return database;
};

const executeSql = (tx, query, params = []) => {
    return new Promise((resolve, reject) => {
        tx.executeSql(
            query,
            params,
            (tx, results) => resolve(results),
            (tx, error) => reject(error),
        );
    });
};

const insertDepartmentsData = departments => {
    const promises = departments.map(department =>
        insertOrUpdateDepartment(department),
    );
    return Promise.all(promises)
        .then(() => {
            console.log('All departments inserted or updated successfully');
        })
        .catch(error => {
            console.error('Error in insert or update operation:', error);
        });
    // return db.transaction(tx => {
    //   departments.forEach(department => {
    //     tx.executeSql(
    //       'INSERT INTO Departments (id, name) VALUES (?,?)',
    //       [department.id, department.name]
    //     );
    //   });
    // }).catch(error => {
    //   console.error('error:', error);
    // });
};

const insertOrUpdateDepartment = department => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            // First, check if the department already exists
            tx.executeSql(
                'SELECT * FROM Departments WHERE id = ?',
                [department.id],
                (tx, results) => {
                    if (results.rows.length > 0) {
                        // If the department exists, update it
                        tx.executeSql(
                            'UPDATE Departments SET name = ? WHERE id = ?',
                            [department.name, department.id],
                            () => {
                                console.log(
                                    `Updated department with id: ${department.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error updating department:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    } else {
                        // If the department does not exist, insert it
                        tx.executeSql(
                            'INSERT INTO Departments (id, name) VALUES (?, ?)',
                            [department.id, department.name],
                            () => {
                                console.log(
                                    `Inserted department with id: ${department.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error inserting department:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    }
                },
                (tx, error) => {
                    console.error(
                        'Error checking department existence:',
                        error,
                    );
                    reject(error);
                },
            );
        });
    });
};

const insertPositionsData = positions => {
    const promises = positions.map(position =>
        insertOrUpdatePosition(position),
    );
    return Promise.all(promises)
        .then(() => {
            console.log('All positions inserted or updated successfully');
        })
        .catch(error => {
            console.error('Error in insert or update operation:', error);
        });
};

const insertOrUpdatePosition = position => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            // First, check if the department already exists
            tx.executeSql(
                'SELECT * FROM Positions WHERE id = ?',
                [position.id],
                (tx, results) => {
                    if (results.rows.length > 0) {
                        // If the department exists, update it
                        tx.executeSql(
                            'UPDATE Positions SET name = ? WHERE id = ?',
                            [position.name, position.id],
                            () => {
                                console.log(
                                    `Updated Positions with id: ${position.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error updating Positions:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    } else {
                        // If the department does not exist, insert it
                        tx.executeSql(
                            'INSERT INTO Positions (id, name) VALUES (?, ?)',
                            [position.id, position.name],
                            () => {
                                console.log(
                                    `Inserted Positions with id: ${position.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error inserting position:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    }
                },
                (tx, error) => {
                    console.error('Error checking position existence:', error);
                    reject(error);
                },
            );
        });
    });
};

const insertEmployeeData = positions => {
    const promises = positions.map(position =>
        insertOrUpdateEmployee(position),
    );
    return Promise.all(promises)
        .then(() => {
            console.log('All positions inserted or updated successfully');
        })
        .catch(error => {
            console.error('Error in insert or update operation:', error);
        });
};

const insertOrUpdateEmployee = employee => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            // First, check if the department already exists
            tx.executeSql(
                'SELECT * FROM Employee WHERE id = ?',
                [employee.id],
                (tx, results) => {
                    if (results.rows.length > 0) {
                        // If the department exists, update it
                        tx.executeSql(
                            'UPDATE Employee SET firstname = ?, middlename = ?, lastname = ?,  employee_no = ?, position_id = ?, position = ?,  estatus = ?, weekly_payroll = ?  WHERE id = ?',
                            [
                                employee.firstname,
                                employee.middlename,
                                employee.lastname,
                                employee.employee_no,
                                employee.position_id,
                                employee.position,
                                employee.status,
                                employee.weekly_payroll,
                                employee.id,
                            ],
                            () => {
                                console.log(
                                    `Updated Employee with id: ${employee.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error updating Employee:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    } else {
                        // If the department does not exist, insert it
                        tx.executeSql(
                            'INSERT INTO Employee (id, firstname, middlename, lastname, employee_no, position_id, position , estatus, weekly_payroll ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [
                                employee.id,
                                employee.firstname,
                                employee.middlename,
                                employee.lastname,
                                employee.employee_no,
                                employee.position_id,
                                employee.position,
                                employee.status,
                                employee.weekly_payroll,
                            ],
                            () => {
                                console.log(
                                    `Inserted employee with id: ${employee.id}`,
                                );
                                resolve();
                            },
                            (tx, error) => {
                                console.error(
                                    'Error inserting Employee:',
                                    error,
                                );
                                reject(error);
                            },
                        );
                    }
                },
                (tx, error) => {
                    console.error('Error checking Employee existence:', error);
                    reject(error);
                },
            );
        });
    });
};

async function insertMyEmployeeData(datas) {
    // ✅ Ensure we always work with an array
    const employees = Array.isArray(datas) ? datas : [datas];

    const insertOrUpdateMyEmployee = item => {
        return new Promise((resolve, reject) => {
            try {
                if (!item?.id) {
                    console.warn('Skipping invalid employee record:', item);
                    return resolve();
                }

                const site_id = item.site_id || 1;
                const code = String(item.code || '').trim();

                if (!code) {
                    return reject(
                        new Error(
                            `Biometric code is required for ${item.firstname || ''} ${item.lastname || ''}`.trim(),
                        ),
                    );
                }

                db.transaction(tx => {
                    // Load the selected employee first so editing its own code
                    // does not look like a duplicate.
                    tx.executeSql(
                        'SELECT * FROM MyEmployee WHERE id = ?',
                        [item.id],
                        (tx, results) => {
                            const saveEmployee = () => {
                                const query = results.rows.length === 0
                                    ? 'INSERT INTO MyEmployee (id, code, site_id) VALUES (?, ?, ?)'
                                    : 'UPDATE MyEmployee SET code = ?, site_id = ? WHERE id = ?';
                                const params = results.rows.length === 0
                                    ? [item.id, code, site_id]
                                    : [code, site_id, item.id];

                                tx.executeSql(
                                    query,
                                    params,
                                    () => {
                                        console.log(
                                            results.rows.length === 0
                                                ? '✅ Inserted employee ID:'
                                                : '📝 Updated employee ID:',
                                            item.id,
                                        );
                                        resolve();
                                    },
                                    (tx, error) => {
                                        console.error('❌ MyEmployee save error:', error);
                                        reject(error);
                                    },
                                );
                            };

                            // A biometric code may belong to only one employee.
                            // If it is already mapped, move the mapping to the
                            // employee currently being configured.
                            tx.executeSql(
                                'SELECT id FROM MyEmployee WHERE code = ? AND id <> ?',
                                [code, item.id],
                                (tx, results) => {
                                    if (results.rows.length > 0) {
                                        tx.executeSql(
                                            'DELETE FROM MyEmployee WHERE code = ? AND id <> ?',
                                            [code, item.id],
                                            () => saveEmployee(),
                                            (tx, error) => {
                                                console.error(
                                                    '❌ Code reassignment error:',
                                                    error,
                                                );
                                                reject(error);
                                            },
                                        );
                                    } else {
                                        saveEmployee();
                                    }
                                },
                                (tx, error) => {
                                    console.error('❌ Check code conflict error:', error);
                                    reject(error);
                                },
                            );
                        },
                        (tx, error) => {
                            console.error(
                                '❌ Check code existence error:',
                                error,
                            );
                            reject(error);
                        },
                    );
                });
            } catch (error) {
                console.error('❌ Transaction error:', error);
                reject(error);
            }
        });
    };

    // Run all insert/update operations safely
    await Promise.all(employees.map(insertOrUpdateMyEmployee));
}

async function insertDTRData(datas) {
    const {date_from, date_to, device_id, status, file, weekly_payroll} =
        datas.dtr;

    const dtrDetailsData = datas.dtrDetails || [];
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                tx.executeSql(
                    `INSERT INTO DTR (date_from, date_to, device_id, status, file, weekly_payroll)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        date_from,
                        date_to,
                        device_id,
                        status,
                        file,
                        weekly_payroll,
                    ],
                    (tx, results) => {
                        const {insertId} = results;

                        // ✅ Step 2: Insert each DTR_details row (also store site_id)
                        dtrDetailsData.forEach(item => {
                            const logs = JSON.stringify(item.logs);
                            tx.executeSql(
                                `INSERT INTO DTR_details (dtr_id, employee_id, date_time, hours, type, logs, ot, ei)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [
                                    insertId,
                                    item.employee_id,
                                    item.date,
                                    item.hours,
                                    item.status,
                                    logs,
                                    0,
                                    0,
                                ],
                                () => {
                                    console.log(
                                        'Inserted into DTR_details successfully',
                                    );
                                },
                                (tx, error) => {
                                    console.error(
                                        'Error inserting into DTR_details:',
                                        error,
                                    );
                                    reject(error);
                                },
                            );
                        });

                        resolve(insertId);
                    },
                    (tx, error) => {
                        console.error('Error inserting into DTR:', error);
                        reject(error);
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error);
            },
        );
    });
}

const fetchDepartmentsData = () => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Departments',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const departments = [];
                    for (let i = 0; i < rows.length; i++) {
                        departments.push(rows.item(i));
                    }
                    resolve(departments);
                },
                (tx, error) => {
                    console.error('Error fetching departments:', error);
                    reject(error);
                },
            );
        });
    });
};

const fetchPositionsData = () => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Positions',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching positions:', error);
                    reject(error);
                },
            );
        });
    });
};

const fetchEmployeesData = () => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Employee WHERE estatus = 1',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching positions:', error);
                    reject(error);
                },
            );
        });
    });
};

const fetchMyEmployeeData = async () => {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        database.transaction(tx => {
            tx.executeSql(
                'SELECT e.id, e.firstname, e.middlename, e.lastname, e.employee_no, e.position_id, e.position, e.estatus, e.weekly_payroll, emp.code, emp.site_id FROM MyEmployee AS emp INNER JOIN Employee AS e ON emp.id = e.id',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching my employee data:', error);
                    reject(error);
                },
            );
        });
    });
};

export const fetchEmployeesFromDB = (page, pageSize) => {
    return new Promise((resolve, reject) => {
        const offset = (page - 1) * pageSize;
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM Employee WHERE estatus = 1',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const employees = [];
                    for (let i = 0; i < rows.length; i++) {
                        employees.push(rows.item(i));
                    }
                    resolve(employees);
                },
                (tx, error) => {
                    console.error('Error fetching employees:', error);
                    reject(error);
                },
            );
        });
    });
};

const fetchDTRData = async () => {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        database.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM DTR ORDER BY id DESC',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching DTR data:', error);
                    reject(error);
                },
            );
        });
    });
};

// 'SELECT emp.*, e.* FROM MyEmployee AS emp INNER JOIN employee AS e ON emp.id = e.id',
const fetchDTRDetailsData = async id => {
    const database = await getDatabase();
    return new Promise((resolve, reject) => {
        database.transaction(tx => {
            tx.executeSql(
                'SELECT a.*, e.employee_no, m.code, e.lastname, e.firstname, e.middlename  FROM DTR_details AS a INNER JOIN employee AS e ON e.id = a.employee_id INNER JOIN MyEmployee AS m ON m.id = a.employee_id WHERE a.dtr_id = ? ORDER BY date_time ASC',
                [id],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching my DTR_details data:', error);
                    reject(error);
                },
            );
        });
    });
};

async function deleteMyEmployeeData(id) {
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'DELETE FROM  MyEmployee  WHERE id = ?',
                    [id],
                    (tx, results) => {
                        console.error('MyEmployee DATA DELETED:');
                        resolve(id);
                    },
                    (tx, error) => {
                        console.error('Error DELETING into MyEmployee:', error);
                        reject(error); // Reject with the error
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function deleteMyDTRData(id) {
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'DELETE FROM  DTR  WHERE id = ?',
                    [id],
                    (tx, results) => {
                        console.error('DTR DETA DELETED:');
                        resolve(id);
                    },
                    (tx, error) => {
                        console.error('Error DELETING into DTR:', error);
                        reject(error); // Reject with the error
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function updateMyDTRData(datas) {
    const {id, ...updateFields} = datas;

    // Validate that we have an ID and at least one field to update
    if (!id) {
        return Promise.reject(new Error('ID is required for update'));
    }

    if (Object.keys(updateFields).length === 0) {
        return Promise.reject(new Error('No fields to update'));
    }

    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Dynamically build the SET clause and parameters
                const setClause = Object.keys(updateFields)
                    .map(field => `${field} = ?`)
                    .join(', ');

                const parameters = [...Object.values(updateFields), id];

                tx.executeSql(
                    `UPDATE DTR_details SET ${setClause} WHERE id = ?`,
                    parameters,
                    (tx, results) => {
                        console.info(
                            'DTR details record updated successfully.',
                        );
                        resolve({id, updatedFields: updateFields});
                    },
                    (tx, error) => {
                        console.error(
                            'Error updating DTR details record:',
                            error,
                        );
                        reject(error);
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error);
            },
        );
    });
}

async function updateMyDTRDataArray(records) {
    // Validate input
    if (!Array.isArray(records) || records.length === 0) {
        return Promise.reject(new Error('No records provided for update'));
    }

    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                records.forEach(record => {
                    const {id, ...updateFields} = record;

                    // Validate each record
                    if (!id) {
                        console.warn('⚠️ Skipping record without ID:', record);
                        return;
                    }

                    if (Object.keys(updateFields).length === 0) {
                        console.warn(
                            `⚠️ Record ${id} has no fields to update, skipping.`,
                        );
                        return;
                    }

                    // Build the SET clause dynamically
                    const setClause = Object.keys(updateFields)
                        .map(field => `${field} = ?`)
                        .join(', ');

                    const parameters = [...Object.values(updateFields), id];

                    // Execute SQL
                    tx.executeSql(
                        `UPDATE DTR_details SET ${setClause} WHERE id = ?`,
                        parameters,
                        () => {
                            console.info(
                                `✅ Record ${id} updated successfully`,
                            );
                        },
                        (tx, error) => {
                            console.error(
                                `❌ Error updating record ${id}:`,
                                error,
                            );
                        },
                    );
                });
            },
            error => {
                console.error('Transaction error:', error);
                reject(error);
            },
            () => {
                console.info('🎉 All records updated successfully.');
                resolve(records.map(r => r.id));
            },
        );
    });
}

async function updateMyDTRDataHours(datas) {
    const hours = datas.hours;
    const id = datas.id;
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'UPDATE DTR_details SET hours = ? WHERE id = ?', // Clear SQL statement with parameter placeholders
                    [hours, id], // Array with update data and ID
                    (tx, results) => {
                        console.info(
                            'DTR  details record updated successfully.',
                        );
                        resolve(id); // Resolve with updated ID if needed
                    },
                    (tx, error) => {
                        console.error(
                            'Error updating DTR details record:',
                            error,
                        );
                        reject(error); // Reject with error object
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function updateMyDTRDetails(datas) {
    const id = datas.id;
    const logs = JSON.stringify(datas.logs);
    const hours = datas.hours;
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'UPDATE DTR_details SET logs = ?, hours = ? WHERE id = ?',
                    [logs, hours, id],
                    (tx, results) => {
                        console.info(
                            'DTR  details record updated successfully.',
                        );
                        resolve(id); // Resolve with updated ID if needed
                    },
                    (tx, error) => {
                        console.error(
                            'Error updating DTR details record:',
                            error,
                        );
                        reject(error); // Reject with error object
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function isertMyDTRDetails(datas) {
    const {id, employee_id, logs, date_time, hours} = datas;
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                tx.executeSql(
                    `INSERT INTO DTR_details (dtr_id, employee_id, date_time, hours, type, logs, ot)
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [id, employee_id, date_time, hours, 'manual', logs, 0],
                    (tx, results) => {
                        console.info(
                            'DTR  details record updated successfully.',
                        );
                        resolve(id); // Resolve with updated ID if needed
                    },
                    (tx, error) => {
                        console.error(
                            'Error updating DTR details record:',
                            error,
                        );
                        reject(error); // Reject with error object
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function deleteMyDTRDetailsData(params) {
    const id = params?.id;
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'DELETE FROM  DTR_details  WHERE id = ?',
                    [id],
                    (tx, results) => {
                        console.log('DTR DTR_details DELETED:');
                        resolve(id);
                    },
                    (tx, error) => {
                        console.error(
                            'Error DELETING into DTR_details:',
                            error,
                        );
                        reject(error); // Reject with the error
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

async function insertMyDTRDetails(datas) {
    const {image, name, company} = datas;
    const dateVisited = new Date().toISOString();
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                tx.executeSql(
                    `INSERT INTO VisitorLogs (image, name, company, date_visited)
                                 VALUES (?, ?, ?, ?)`,
                    [image, name, company, dateVisited],
                    (tx, results) => {
                        console.info('VisitorLogs successfully save.');
                        resolve(name); // Resolve with updated ID if needed
                    },
                    (tx, error) => {
                        console.error('Error  VisitorLogs  record:', error);
                        reject(error); // Reject with error object
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

const fetchVisitorLogsData = () => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM VisitorLogs  ORDER BY id DESC ',
                [],
                (tx, results) => {
                    const rows = results.rows;
                    const data = [];
                    for (let i = 0; i < rows.length; i++) {
                        data.push(rows.item(i));
                    }
                    resolve(data);
                },
                (tx, error) => {
                    console.error('Error fetching my employee data:', error);
                    reject(error);
                },
            );
        });
    });
};

async function deleteVisitorLogsData(params) {
    const id = params?.id;
    return new Promise((resolve, reject) => {
        db.transaction(
            tx => {
                // Step 1: Insert into DTR table
                tx.executeSql(
                    'DELETE FROM  VisitorLogs  WHERE id = ?',
                    [id],
                    (tx, results) => {
                        console.log('DTR VisitorLogs DELETED:');
                        resolve(id);
                    },
                    (tx, error) => {
                        console.error(
                            'Error DELETING into VisitorLogs:',
                            error,
                        );
                        reject(error); // Reject with the error
                    },
                );
            },
            error => {
                console.error('Transaction error:', error);
                reject(error); // Reject with the transaction error
            },
        );
    });
}

export {
    initDatabase,
    insertDepartmentsData,
    insertPositionsData,
    fetchDepartmentsData,
    fetchPositionsData,
    insertEmployeeData,
    fetchEmployeesData,
    insertMyEmployeeData,
    fetchMyEmployeeData,
    insertDTRData,
    fetchDTRData,
    fetchDTRDetailsData,
    deleteMyEmployeeData,
    deleteMyDTRData,
    updateMyDTRData,
    updateMyDTRDetails,
    isertMyDTRDetails,
    deleteMyDTRDetailsData,
    insertMyDTRDetails,
    fetchVisitorLogsData,
    deleteVisitorLogsData,
    updateMyDTRDataHours,
    updateMyDTRDataArray,
};

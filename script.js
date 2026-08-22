/* ==========================================
   EMPLOYEE PROFILE + ATTENDANCE SYSTEM
========================================== */


/* ==========================================
   EMPLOYEE INFORMATION
========================================== */

let employee = {

    name: "Purvika Santhosh",

    email: "purvika@example.com",

    phone: "+91 9876543210",

    address: "Bengaluru, Karnataka",

    employeeId: "EMP001",

    department: "Computer Science",

    designation: "Software Developer",

    joiningDate: "01 June 2026"

};


/* ==========================================
   ATTENDANCE DATA
========================================== */

let attendance =
    JSON.parse(
        localStorage.getItem("attendance")
    ) || [

        {
            employee: "Purvika Santhosh",

            date: "22 Aug 2026",

            checkIn: "09:02",

            checkOut: "17:10",

            status: "Present"
        },

        {
            employee: "Purvika Santhosh",

            date: "21 Aug 2026",

            checkIn: "09:15",

            checkOut: "17:05",

            status: "Present"
        },

        {
            employee: "Purvika Santhosh",

            date: "20 Aug 2026",

            checkIn: "09:30",

            checkOut: "13:30",

            status: "Half-day"
        }

    ];


/* ==========================================
   OTHER EMPLOYEES
========================================== */

const otherEmployees = [

    {
        name: "Rahul Kumar",

        date: "22 Aug 2026",

        checkIn: "09:05",

        checkOut: "17:15",

        status: "Present"
    },

    {
        name: "Ananya Sharma",

        date: "22 Aug 2026",

        checkIn: "--",

        checkOut: "--",

        status: "Absent"
    },

    {
        name: "Arjun R",

        date: "22 Aug 2026",

        checkIn: "--",

        checkOut: "--",

        status: "Leave"
    }

];


/* ==========================================
   CURRENT ROLE
========================================== */

let currentRole = "Employee";


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadEmployee();

        setTodayDate();

        loadTodayAttendance();

        displayAttendance("all");

        displayHRAttendance();

        updateRoleUI();

    }
);


/* ==========================================
   LOAD EMPLOYEE INFORMATION
========================================== */

function loadEmployee() {

    document.getElementById(
        "employeeName"
    ).textContent = employee.name;


    document.getElementById(
        "employeeRole"
    ).textContent = employee.designation;


    document.getElementById(
        "detailName"
    ).textContent = employee.name;


    document.getElementById(
        "detailEmail"
    ).textContent = employee.email;


    document.getElementById(
        "detailPhone"
    ).textContent = employee.phone;


    document.getElementById(
        "detailAddress"
    ).textContent = employee.address;


    document.getElementById(
        "detailId"
    ).textContent = employee.employeeId;


    document.getElementById(
        "detailDepartment"
    ).textContent = employee.department;


    document.getElementById(
        "detailDesignation"
    ).textContent = employee.designation;


    document.getElementById(
        "detailJoining"
    ).textContent = employee.joiningDate;

}


/* ==========================================
   TODAY'S DATE
========================================== */

function setTodayDate() {

    const today = new Date();

    document.getElementById(
        "todayDate"
    ).textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",

                month: "short",

                year: "numeric"
            }
        );

}


/* ==========================================
   GET TODAY AS STRING
========================================== */

function getTodayString() {

    const today = new Date();

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const monthNames = [

        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"

    ];


    const month =
        monthNames[
            today.getMonth()
        ];


    const year =
        today.getFullYear();


    return `${day} ${month} ${year}`;

}


/* ==========================================
   GET CURRENT TIME
========================================== */

function getCurrentTime() {

    return new Date().toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",

            minute: "2-digit",

            hour12: false
        }
    );

}


/* ==========================================
   CHECK-IN
========================================== */

function checkIn() {

    const today =
        getTodayString();


    const existing =
        attendance.find(
            record =>
                record.employee ===
                employee.name &&

                record.date === today
        );


    if (
        existing &&
        existing.checkIn !== "--"
    ) {

        alert(
            "You have already checked in today."
        );

        return;
    }


    const time =
        getCurrentTime();


    if (existing) {

        existing.checkIn = time;

        existing.status = "Present";

    }

    else {

        attendance.unshift({

            employee:
                employee.name,

            date:
                today,

            checkIn:
                time,

            checkOut:
                "--",

            status:
                "Present"

        });

    }


    saveAttendance();

    loadTodayAttendance();

    displayAttendance("all");

    displayHRAttendance();


    alert(
        `Check-in successful at ${time}`
    );

}


/* ==========================================
   CHECK-OUT
========================================== */

function checkOut() {

    const today =
        getTodayString();


    const existing =
        attendance.find(
            record =>
                record.employee ===
                employee.name &&

                record.date === today
        );


    if (
        !existing ||
        existing.checkIn === "--"
    ) {

        alert(
            "Please check-in before checking out."
        );

        return;
    }


    if (
        existing.checkOut !== "--"
    ) {

        alert(
            "You have already checked out today."
        );

        return;
    }


    const time =
        getCurrentTime();


    existing.checkOut = time;


    saveAttendance();

    loadTodayAttendance();

    displayAttendance("all");

    displayHRAttendance();


    alert(
        `Check-out successful at ${time}`
    );

}


/* ==========================================
   SAVE ATTENDANCE
========================================== */

function saveAttendance() {

    localStorage.setItem(

        "attendance",

        JSON.stringify(
            attendance
        )

    );

}


/* ==========================================
   LOAD TODAY'S ATTENDANCE
========================================== */

function loadTodayAttendance() {

    const today =
        getTodayString();


    const record =
        attendance.find(
            item =>
                item.employee ===
                employee.name &&

                item.date === today
        );


    document.getElementById(
        "todayCheckIn"
    ).textContent =
        record
            ? record.checkIn
            : "--";


    document.getElementById(
        "todayCheckOut"
    ).textContent =
        record
            ? record.checkOut
            : "--";


    document.getElementById(
        "todayStatus"
    ).textContent =
        record
            ? record.status
            : "Not Marked";

}


/* ==========================================
   DISPLAY EMPLOYEE ATTENDANCE
========================================== */

function displayAttendance(
    filter
) {

    const table =
        document.getElementById(
            "attendanceTable"
        );


    table.innerHTML = "";


    let records =
        attendance.filter(
            record =>
                record.employee ===
                employee.name
        );


    if (
        filter === "week"
    ) {

        records =
            records.slice(0, 7);

    }


    if (
        filter === "month"
    ) {

        records =
            records.slice(0, 30);

    }


    records.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${record.date}
                </td>

                <td>
                    ${record.checkIn}
                </td>

                <td>
                    ${record.checkOut}
                </td>

                <td>

                    <span
                        class="status ${getStatusClass(record.status)}"
                    >
                        ${record.status}
                    </span>

                </td>

            `;


            table.appendChild(row);

        }
    );


    if (
        records.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="4">
                    No attendance records found.
                </td>

            </tr>

        `;

    }

}


/* ==========================================
   STATUS CLASS
========================================== */

function getStatusClass(
    status
) {

    return status
        .toLowerCase()
        .replace(
            " ",
            "-"
        );

}


/* ==========================================
   ATTENDANCE FILTER
========================================== */

function filterAttendance(
    filter,
    button
) {

    document
        .querySelectorAll(
            ".filter-btn"
        )
        .forEach(
            btn => {

                btn.classList.remove(
                    "active"
                );

            }
        );


    button.classList.add(
        "active"
    );


    displayAttendance(
        filter
    );

}


/* ==========================================
   HR ATTENDANCE
========================================== */

function displayHRAttendance() {

    const table =
        document.getElementById(
            "hrAttendanceTable"
        );


    table.innerHTML = "";


    const allRecords = [

        ...attendance,

        ...otherEmployees

    ];


    allRecords.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${record.employee || record.name}
                </td>

                <td>
                    ${record.date}
                </td>

                <td>
                    ${record.checkIn}
                </td>

                <td>
                    ${record.checkOut}
                </td>

                <td>

                    <span
                        class="status ${getStatusClass(record.status)}"
                    >
                        ${record.status}
                    </span>

                </td>

            `;


            table.appendChild(row);

        }
    );


    updateHRSummary(
        allRecords
    );

}


/* ==========================================
   HR SUMMARY
========================================== */

function updateHRSummary(
    records
) {

    let present = 0;

    let absent = 0;

    let leave = 0;


    records.forEach(
        record => {

            if (
                record.status ===
                "Present"
            ) {

                present++;

            }

            else if (
                record.status ===
                "Absent"
            ) {

                absent++;

            }

            else if (
                record.status ===
                "Leave"
            ) {

                leave++;

            }

        }
    );


    document.getElementById(
        "totalPresent"
    ).textContent =
        present;


    document.getElementById(
        "totalAbsent"
    ).textContent =
        absent;


    document.getElementById(
        "totalLeave"
    ).textContent =
        leave;

}


/* ==========================================
   OPEN EDIT PROFILE
========================================== */

function openEditProfile() {

    document.getElementById(
        "editName"
    ).value =
        employee.name;


    document.getElementById(
        "editPhone"
    ).value =
        employee.phone;


    document.getElementById(
        "editAddress"
    ).value =
        employee.address;


    document.getElementById(
        "editDesignation"
    ).value =
        employee.designation;


    document.getElementById(
        "editDepartment"
    ).value =
        employee.department;


    document
        .getElementById(
            "editModal"
        )
        .classList.add(
            "show"
        );

}


/* ==========================================
   CLOSE EDIT PROFILE
========================================== */

function closeEditProfile() {

    document
        .getElementById(
            "editModal"
        )
        .classList.remove(
            "show"
        );

}


/* ==========================================
   SAVE PROFILE
========================================== */

function saveProfile() {

    employee.name =
        document.getElementById(
            "editName"
        ).value;


    employee.phone =
        document.getElementById(
            "editPhone"
        ).value;


    employee.address =
        document.getElementById(
            "editAddress"
        ).value;


    employee.designation =
        document.getElementById(
            "editDesignation"
        ).value;


    employee.department =
        document.getElementById(
            "editDepartment"
        ).value;


    loadEmployee();

    closeEditProfile();


    alert(
        "Profile updated successfully!"
    );

}


/* ==========================================
   CHANGE PROFILE PICTURE
========================================== */

function changeProfilePicture(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            document.getElementById(
                "profilePicture"
            ).src =
                e.target.result;

        };


    reader.readAsDataURL(
        file
    );

}


/* ==========================================
   SWITCH ROLE
========================================== */

function toggleRole() {

    if (
        currentRole ===
        "Employee"
    ) {

        currentRole =
            "HR/Admin";

    }

    else {

        currentRole =
            "Employee";

    }


    updateRoleUI();

}


/* ==========================================
   UPDATE ROLE UI
========================================== */

function updateRoleUI() {

    document.getElementById(
        "currentRole"
    ).textContent =
        currentRole;


    const roleButton =
        document.getElementById(
            "roleButton"
        );


    const hrSection =
        document.getElementById(
            "hrSection"
        );


    if (
        currentRole ===
        "HR/Admin"
    ) {

        roleButton.textContent =
            "Switch to Employee";


        hrSection.style.display =
            "block";

    }

    else {

        roleButton.textContent =
            "Switch to HR/Admin";


        hrSection.style.display =
            "none";

    }

}


/* ==========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================== */

document
    .getElementById(
        "editModal"
    )
    .addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                this
            ) {

                closeEditProfile();

            }

        }
    );
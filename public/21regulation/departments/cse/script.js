const options = { day: '2-digit', month: 'long', year: 'numeric' };
    document.getElementById("date").innerText = new Date().toLocaleDateString("en-GB", options);

    const gradeOptions = [
      { value: "", text: "Select", disabled: true, selected: true },
      { value: "10", text: "O" },
      { value: "9", text: "A+" },
      { value: "8", text: "A" },
      { value: "7", text: "B+" },
      { value: "6", text: "B" },
      { value: "5", text: "C+" },
      { value: "4", text: "C" },
      { value: "3", text: "D" },
      { value: "2", text: "D+" },
      { value: "0", text: "RA" }
    ];

    let subjects = [];

window.onload = async () => {
  const [semester, ...deptArr] = document.title.split(" ");
  const department = deptArr.join(" ");
  const batch = document.getElementById("batch")?.value;

  if (!batch) {
    alert("Please select a batch to load the subjects.");
    return;
  }

  try {
    const response = await fetch(`/api/subjects?semester=${semester}&department=${department}&batch=${batch}`);
    if (!response.ok) throw new Error("Failed to fetch subjects");
    subjects = await response.json();
    populateSubjects();
  } catch (err) {
    console.error("Error loading subjects:", err);
    alert("Failed to load subjects for this page.");
  }
};

function populateSubjects() {
  const container = document.getElementById("div");
  container.innerHTML = ""; 

  subjects.forEach(subject => {
    const div = document.createElement("div");
    div.id = "cal";

    const label = document.createElement("label");
    label.setAttribute("for", subject._id);
    label.textContent = subject.label;

    const select = document.createElement("select");
    select.id = subject._id;
    select.className = "align";
    select.required = true;

    gradeOptions.forEach(opt => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      if (opt.disabled) option.disabled = true;
      if (opt.selected) option.selected = true;
      select.appendChild(option);
    });

    div.appendChild(label);
    div.appendChild(select);
    container.appendChild(div);
    container.appendChild(document.createElement("br"));
  });
}


    async function updateDisplay() {
      const username = document.getElementById("username").value.trim();
      if (username.length !== 12) {
        alert("Enter a valid 12-digit register number");
        return;
      }

      const formValid = [...document.querySelectorAll("select")].every(select => select.checkValidity());
      if (!formValid) {
        document.querySelector("select:invalid").reportValidity();
        return;
      }

      let totalCredits = 0;
      let weightedGradeSum = 0;
      let grades = {};

      subjects.forEach(subject => {
        const grade = parseInt(document.getElementById(subject._id).value);
        weightedGradeSum += grade * subject.credit;
        totalCredits += subject.credit;
        grades[subject.label] = grade;
      });

      const cgpa = (weightedGradeSum / totalCredits).toFixed(3);
      document.getElementById("output").textContent = `Your CGPA is: ${cgpa}`;

      const title = document.title;

      try {
        const response = await fetch('/submit-cgpa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, username, grades, cgpa })
        });

        const data = await response.json();
        alert(data.message);
      } catch (error) {
        alert("Error submitting data. Try again.");
        console.error(error);
      }

      window.cgpaCalculated = cgpa;
    }

//     async function downloadFancyPDF() {
//     try {
//         const { jsPDF } = window.jspdf;
//         const doc = new jsPDF();

//         const username = document.getElementById("username").value.trim();
//         if (!username || username.length !== 12) {
//             alert("Please enter a valid 12-digit register number.");
//             return;
//         }

//         const cgpaText = document.getElementById("output").textContent;
//         if (!cgpaText) {
//             alert("Please calculate your CGPA first.");
//             return;
//         }

//         const title = document.title;
//         const [semester, dept] = title.split(" ");
//         const semesterLabel = `Semester: ${semester}`;
//         const deptLabel = `Degree & Department: ${dept}`;

//         const tableData = subjects.map(subject => {
//             const select = document.getElementById(subject._id);
//             const gradePoint = select.value;
//             const gradeText = select.options[select.selectedIndex].text;
//             return [subject.label, gradeText, gradePoint, subject.credit];
//         });

//         // Optional: comment out if image issues occur
//         // const logoBase64 = await imageToBase64("/images/logo.png");
//         // doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);

//         doc.setFontSize(16);
//         doc.text("Sri Shakthi Institute of Engineering and Technology", 105, 20, { align: "center" });
//         doc.setFontSize(12);
//         doc.text(deptLabel, 105, 38, { align: "center" });
//         doc.text("Regulation: 2021", 105, 45, { align: "center" });
//         doc.text(semesterLabel, 105, 52, { align: "center" });
//         doc.text(`Register Number: ${username}`, 105, 59, { align: "center" });

//         doc.autoTable({
//             startY: 69,
//             head: [['Subject', 'Grade (Letter)', 'Grade (Point)', 'Credit']],
//             body: tableData,
//         });

//         doc.text(cgpaText, 105, doc.lastAutoTable.finalY + 10, { align: "center" });

//         doc.save(`${username}_CGPA_Report.pdf`);
//     } catch (err) {
//         alert("Error generating PDF. Check console for details.");
//         console.error(err);
//     }
// }

async function downloadFancyPDF() {
  if (!window.cgpaCalculated) {
    alert("Please calculate your CGPA first before downloading the PDF.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const username = document.getElementById("username").value.trim();
  if (!username || username.length !== 12) {
    alert("Please enter a valid 12-digit register number.");
    return;
  }

  const title = document.title;
  const [semester, ...deptParts] = title.split(" ");
  const dept = deptParts.join(" ");
  const cgpaText = document.getElementById("output").textContent;
  const semesterLabel = `Semester: ${semester}`;
  const deptLabel = `Department: ${dept}`;

  // Build subject rows
  const tableData = subjects.map(subject => {
    const select = document.getElementById(subject._id);
    const gradePoint = select.value;
    const gradeText = select.options[select.selectedIndex].text;
    return [
      subject.label,
      gradeText,
      gradePoint,
      subject.credit
    ];
  });

  // Calculate and add Total Credits row (new)
  const totalCredits = subjects.reduce((sum, s) => sum + s.credit, 0);
  tableData.push([
    { content: 'Total Credits', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
    { content: totalCredits.toString(), styles: { fontStyle: 'bold' } }
  ]);

  // Logo handling
  let logoBase64 = "";
  let logo1Base64 = "";
  try {
    logoBase64 = await imageToBase64("/images/logo.png");
    logo1Base64 = await imageToBase64("/images/1.png");
  } catch (err) {
    console.warn("Logo image(s) could not be loaded. Skipping logos in PDF.");
  }
  if (logoBase64) doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);
  if (logo1Base64) doc.addImage(logo1Base64, 'PNG', 180, 10, 20, 20);

  // College Title and Info
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text("Sri Shakthi Institute of Engineering and Technology\n(An Autonomous Institution)", 105, 20, { align: "center" });
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(deptLabel, 105, 38, { align: "center" });
  doc.text("Regulation: 2021", 105, 45, { align: "center" });
  doc.text(semesterLabel, 105, 52, { align: "center" });
  doc.text(`Register Number: ${username}`, 105, 59, { align: "center" });

  // Table with Total Credits
  doc.autoTable({
    startY: 69,
    head: [['Subject', 'Grade (Letter)', 'Grade (Point)', 'Credit']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [82, 236, 31],
      textColor: 0,
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    styles: {
      fontSize: 10,
      textColor: [0, 0, 0]
    }
  });

  // Final CGPA
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${cgpaText}`, 105, finalY, { align: "center" });

  doc.save(`${username}_CGPA_Report.pdf`);
}

//alternative code

  // async function downloadFancyPDF() {
  
  // if (!window.cgpaCalculated) {
  //   alert("Please calculate your CGPA first before downloading the PDF.");
  //   return;
  // }  

  //   const { jsPDF } = window.jspdf;
  //   const doc = new jsPDF();

  //   const username = document.getElementById("username").value.trim();
  //   if (!username || username.length !== 12) {
  //     alert("Please enter a valid 12-digit register number.");
  //     return;
  //   }

  //   const title = document.title;
  //   const [semester, ...deptParts] = title.split(" ");
  //   const dept = deptParts.join(" ");
  //   const cgpaText = document.getElementById("output").textContent;
  //   const semesterLabel = `Semester: ${semester}`;
  //   const deptLabel = `Department: ${dept}`;

  //   const tableData = subjects.map(subject => {
  //     const select = document.getElementById(subject._id);
  //     const gradePoint = select.value;
  //     const gradeText = select.options[select.selectedIndex].text;
  //     return [
  //       subject.label,
  //       gradeText,
  //       gradePoint,
  //       subject.credit
  //     ];
  //   });

  //   //loading images
  //   let logoBase64 = "";
  //   let logo1Base64 = "";

  //   try {
  //     logoBase64 = await imageToBase64("/images/logo.png");
  //     logo1Base64 = await imageToBase64("/images/1.png");
  //   } catch (err) {
  //     console.warn("Logo image(s) could not be loaded. Skipping logos in PDF.");
  //   }

  //   // Draw logos if available
  //   if (logoBase64) doc.addImage(logoBase64, 'PNG', 10, 10, 20, 20);
  //   if (logo1Base64) doc.addImage(logo1Base64, 'PNG', 180, 10, 20, 20);

  //   // College Title
  //   doc.setFontSize(16);
  //   doc.setFont(undefined, 'bold');
  //   doc.text("Sri Shakthi Institute of Engineering and Technology\n(An Autonomous Institution)", 105, 20, { align: "center" });

  //   // Dept Info
  //   doc.setFontSize(12);
  //   doc.setFont(undefined, 'normal');
  //   doc.text(deptLabel, 105, 38, { align: "center" });
  //   doc.text("Regulation: 2021", 105, 45, { align: "center" });
  //   doc.text(semesterLabel, 105, 52, { align: "center" });
  //   doc.text(`Register Number: ${username}`, 105, 59, { align: "center" });

  //   // Table
  //   doc.autoTable({
  //     startY: 69,
  //     head: [['Subject', 'Grade (Letter)', 'Grade (Point)', 'Credit']],
  //     body: tableData,
  //     theme: 'grid',
  //     headStyles: {
  //       fillColor: [82, 236, 31],
  //       textColor: 0,
  //       fontStyle: 'bold',
  //       lineWidth: 0.5,
  //       lineColor: [0, 0, 0]
  //     },
  //     bodyStyles: {
  //       lineWidth: 0.5,
  //       lineColor: [0, 0, 0]
  //     },
  //     styles: {
  //       fontSize: 10,
  //       textColor: [0, 0, 0]
  //     }
  //   });

  //   // Final CGPA
  //   const finalY = doc.lastAutoTable.finalY + 10;
  //   doc.setFontSize(13);
  //   doc.setFont(undefined, 'bold');
  //   doc.setTextColor(0, 0, 0);
  //   doc.text(`${cgpaText}`, 105, finalY, { align: "center" });

  //   doc.save(`${username}_CGPA_Report.pdf`);
  // }

  function imageToBase64(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d").drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
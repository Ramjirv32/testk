$(document).ready(function () {

    var current_fs, next_fs, previous_fs;
    var opacity;
    var current = 1;
    var steps = $("fieldset").length;

    setProgressBar(current);

    $(".next").click(function (e) {
        if ($(this).attr("id") === "priority-next-button") {
            const checkedValues = getCheckedValues();

            if (checkedValues === false) {
                e.preventDefault();
                return;
            }
        }

        const country = $("select[name='country']").val();
        const subject = $("select[name='subject']").val();

        if (!country || country === "Select Your Country") {
            $("#country-error").text("Please select a country.");
            e.preventDefault();
            return;
        } else {
            $("#country-error").text("");
        }

        if (!subject || subject === "Select your Subjects") {
            $("#subject-error").text("Please select a subject.");
            e.preventDefault();
            return;
        } else {
            $("#subject-error").text("");
        }

        current_fs = $(this).parent();
        next_fs = $(this).parent().next();

        $("#progressbar li")
            .eq($("fieldset").index(next_fs))
            .addClass("active");

        next_fs.show();

        current_fs.animate(
            { opacity: 0 },
            {
                step: function (now) {

                    opacity = 1 - now;

                    current_fs.css({
                        display: "none",
                        position: "relative",
                    });
                    next_fs.css({ opacity: opacity });
                },
                duration: 500,
            }
        );
        setProgressBar(++current);
    });

    $(".previous").click(function () {
        current_fs = $(this).parent();
        previous_fs = $(this).parent().prev();

        $("#progressbar li")
            .eq($("fieldset").index(current_fs))
            .removeClass("active");

        previous_fs.show();

        current_fs.animate(
            { opacity: 0 },
            {
                step: function (now) {
                    opacity = 1 - now;

                    current_fs.css({
                        display: "none",
                        position: "relative",
                    });
                    previous_fs.css({ opacity: opacity });
                },
                duration: 500,
            }
        );
        setProgressBar(--current);
    });

    function setProgressBar(curStep) {
        var percent = parseFloat(100 / steps) * curStep;
        percent = percent.toFixed();
        $(".progress-bar").css("width", percent + "%");
    }

    function getCheckedValues() {
        const checkedValues = [];
        $(".form-check-input:checked").each(function () {
            checkedValues.push($(this).val());
        });

        if (checkedValues.length !== 3) {
            $("#priority-error").text(
                "Please select exactly 3 options to proceed."
            );
            return false;
        } else {
            $("#priority-error").text("");
        }

        return checkedValues;
    }

    const priorityQuestions = {
        Budget: {
            questions: [
                {
                    type: "radio",
                    question:
                        "Are you willing to learn a foreign language in order to get your PR?",
                    options: ["Yes", "No"],
                },
                {
                    type: "text",
                    question:
                        "What is your budget? (Tuition Fees + Living Expense)",
                },
            ],
        },
        Location: {
            questions: [
                {
                    type: "text",
                    question: "What is your city preference?",
                },
                {
                    type: "select",
                    question: "Reason for choosing this city",
                    options: [
                        "Relative / Friends",
                        "Part-time / Job opportunities",
                        "Dream City",
                    ],
                },
            ],
        },
        "Quality/ranking": {
            questions: [
                {
                    type: "radio",
                    question:
                        "Do you prefer World Ranking and High Quality Institutions?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "What is the university ranking you are targeting?",
                    options: ["Top 50", "Top 100", "Top 200", "Top 500"],
                },
            ],
        },
        "Part time": {
            questions: [
                {
                    type: "radio",
                    question:
                        "What are the most important factors for you when choosing a part-time job while studying abroad?",
                    options: [
                        "Hourly pay",
                        "Availability of Jobs",
                        "Jobs on Campus",
                        "Jobs in the labs",
                    ],
                },
                {
                    type: "radio",
                    question:
                        "Is your preference to work Part time while doing your study?",
                    options: ["Yes", "No"],
                },
            ],
        },
        "PR opportunities": {
            questions: [
                {
                    type: "radio",
                    question:
                        "Are you willing to learn a foreign language in order to get your PR?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "Do you plan to get your Permanent Residency after studying abroad?",
                    options: ["Yes", "No"],
                },
            ],
        },
        "Job opportunities": {
            questions: [
                {
                    type: "radio",
                    question:
                        "Are you looking for countries that give a Job Search visa/Stay back after studies?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "What is the duration of stay back you are looking for?",
                    options: ["1 Year", "2 Years", "3 Years"],
                },
            ],
        },
        "Stay back": {
            questions: [
                {
                    type: "radio",
                    question:
                        "Are you looking for Post Study Work visa/Stay Back option after your graduation?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "What is the duration of stay-back you are looking for?",
                    options: ["1 Year", "2 Years", "3 Years", "4 Years"],
                },
            ],
        },
        Diversity: {
            questions: [
                {
                    type: "radio",
                    question: "Is diverse faculty important for you?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "Do you prefer to study in a multicultural environment?",
                    options: ["Yes", "No"],
                },
            ],
        },
        Research: {
            questions: [
                {
                    type: "radio",
                    question: "Are you looking for a master's with research?",
                    options: ["Yes", "No"],
                },
                {
                    type: "radio",
                    question:
                        "Would you like to continue your Research/PhD after Graduation?",
                    options: ["Yes", "No"],
                },
            ],
        },
    };

    const maxSelection = 3;
    let selectedPriorities = [];

    $(".form-check-input").on("change", function () {
        const checkbox = $(this);

        if (checkbox.is(":checked")) {
            selectedPriorities.push(checkbox.val());
        } else {
            selectedPriorities = selectedPriorities.filter(
                (priority) => priority !== checkbox.val()
            );
        }

        if (selectedPriorities.length > maxSelection) {
            const oldestChecked = selectedPriorities.shift();
            $(`.form-check-input[value="${oldestChecked}"]`).prop(
                "checked",
                false
            );
        }
    });

    $("#priority-next-button").on("click", function () {
        const dynamicQuestionsContainer = $(".dynamic-questions-container");
        dynamicQuestionsContainer.each(function () {
            $(this).empty();
        });

        selectedPriorities.forEach((priority, index) => {
            const { questions } = priorityQuestions[priority];
            let html = `<div class="card mb-3">
                            <div class="card-header">
                                <h5>${priority}</h5>
                            </div>
                            <div class="card-body">`;

            questions.forEach((question) => {
                if (question.type === "radio") {
                    html += `<div class="form-group">
                                <label>${question.question}</label><br>`;
                    question.options.forEach((option) => {
                        html += `<div class="form-check">
                                    <input class="form-check-input" type="radio" name="${question.question}" value="${option}" id="${option}">
                                    <label class="form-check-label" for="${option}">
                                        ${option}
                                    </label>
                                  </div>`;
                    });
                    html += `</div>`;
                } else if (question.type === "text") {
                    html += `<div class="form-group">
                                <label>${question.question}</label>
                                <input type="text" class="form-control" name="${question.question}">
                              </div>`;
                } else if (question.type === "select") {
                    html += `<div class="form-group">
                                <label>${question.question}</label>
                                <select class="form-select" name="${question.question}">`;
                    question.options.forEach((option) => {
                        html += `<option value="${option}">${option}</option>`;
                    });
                    html += `</select>
                              </div>`;
                }
            });

            html += `    </div>
                        </div>`;

            dynamicQuestionsContainer.eq(index).html(html);
        });
    });

    $("#survey-submit").on("click", function (e) {
        e.preventDefault();

        let formData = new FormData($("#msform")[0]);

        const selectedPriorities = [];
        $('input[type="checkbox"]:checked').each(function () {
            selectedPriorities.push($(this).val());
        });
        let country_id = parseInt($("#survey-country").val(), 10);
        let intakeTarget = $("#intake-target").val();
        let discipline_id = parseInt($("#discipline").val(), 10);

        formData.append("intake_target", intakeTarget);
        formData.append("country_id", country_id);
        formData.append("discipline_id", discipline_id);
        formData.append("priorities", JSON.stringify(selectedPriorities));

        $.ajax({
            url: "/student-survey/store",
            method: "POST",
            data: formData,
            contentType: false,
            processData: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                $("#msform")[0].reset();
                toastr.success(response.message);
                setTimeout(function () {
                    location.reload();
                }, 3000);
            },
            error: function (xhr) {
                if (xhr.status === 422) {
                    var errors = xhr.responseJSON.errors;
                    $.each(errors, function (key, value) {
                        toastr.error(value[0]);
                    });
                }
            },
        });
    });

});

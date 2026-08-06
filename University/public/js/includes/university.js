$(document).ready(function () {
    $("#add-university-btn").on("click", function (e) {

        e.preventDefault();
        let form = document.getElementById("university-form");
        let formData = new FormData(form);
        console.log(formData);

        $.ajax({
            url: "/add-university",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                toastr.success("University added successfully");
                window.location.href = response.redirectUrl;
                form.reset();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 422) {
                    let errors = jqXHR.responseJSON.errors;
                    for (let field in errors) {
                        toastr.error(errors[field][0]);
                    }
                } else {
                    toastr.error("An error occurred. Please try again.");
                }
            },
        });
    });

    $(document).on("click", "#edit-university", function (e) {
        e.preventDefault();

        var universityId = $(this).data("id");
        window.location.href = "/university/" + universityId + "/edit";
    });

    $(document).on("click", "#update-university", function (e) {
        e.preventDefault();
        var universityId = $(this).data("update-id");
        let form = document.getElementById("university");
        let formData = new FormData(form);
        formData.append("universityId", universityId);

        $.ajax({
            url: "/university/" + universityId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                formData.append("_method", "PUT");
            },
        })
            .done(function (response) {
                toastr.success(response.message);
                window.location.href = response.redirectUrl;
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to update the university. Please try again."
                );
            });
    });

    $(document).on("click", "#delete-university", function (e) {
        e.preventDefault();
        var universityId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this university?")) {
            return;
        }

        $.ajax({
            url: "/university/" + universityId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                toastr.success(response.message);
                window.location.href = response.redirectUrl;
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to delete the university. Please try again."
                );
            },
        });
    });

     $("#add-university-names-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("university-names");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/university_names",
            method: "POST",
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirect_url;
                    form.reset();
                } else {
                    toastr.error("Failed to create University name.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 422) {
                    let errors = jqXHR.responseJSON.errors;
                    for (let field in errors) {
                        toastr.error(errors[field][0]);
                    }
                } else {
                    toastr.error("An error occurred. Please try again.");
                }
            },
        });
    });

    $(document).on("click", "#edit-universityNames", function (e) {
        e.preventDefault();

        var universityNamesId = $(this).data("id");
        window.location.href = "/masters/university_names/" + universityNamesId + "/edit";
    });

    $(document).on("click", "#update-university-names", function (e) {
        e.preventDefault();
        var univNameUpdateId = $(this).data("update-id");
        let form = document.getElementById("university-name");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/university_names/" + univNameUpdateId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function () {
                formData.append("_method", "PUT");
            },
        })
            .done(function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error("Failed to update the University Name. Please try again.");
            });
    });

    $(document).on("click", "#delete-universityNames", function (e) {
        e.preventDefault();
        var univNameDeleteId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this University Name?")) {
            return;
        }

        $.ajax({
            url: "/masters/university_names/" + univNameDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirectUrl;
                } else {
                    toastr.error(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error("Failed to delete the University Name. Please try again.");
            },
        });
    });

    function previewLogo() {
        var logoInput = document.getElementById("logo");
        var logoPreview = document.getElementById("logoPreview");

        if (logoInput.files && logoInput.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                logoPreview.src = e.target.result;
            };

            reader.readAsDataURL(logoInput.files[0]);
        }
    }

    function previewImage() {
        var imageInput = document.getElementById("image");
        var imagePreview = document.getElementById("imagePreview");

        if (imageInput.files && imageInput.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                imagePreview.src = e.target.result;
            };

            reader.readAsDataURL(imageInput.files[0]);
        }
    }

    $("#university-detail-id").on("click", function () {
        var universityId = $(this).data("university-detail-id");
        console.log(universityId);

        $.ajax({
            url: "/university-detail/" + universityId,
            method: "GET",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
        })
            .done(function (response) {

                console.log(response);
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch University details. Please try again.");
            });
    });

    const quill = new Quill("#about-editor", {
        theme: "snow",
        modules: {
            toolbar: [
                ["bold", "italic", "underline"],
                ["link", "image", "video"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["clean"],
            ],
        },
    });
    quill.on("text-change", function () {
        const aboutContent = quill.root.innerHTML;
        document.querySelector("#about").value = aboutContent;
    });

    $('.degree-select2').select2({
        placeholder: 'Select Your Degree',
        allowClear: true
    });

    $('.university-name').select2({
            placeholder: 'Select University Name',
            allowClear: true
        });
});

$(document).ready(function () {
    $("#add-specialProgrammes-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("specialProgrammes");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/special_programmes",
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
                    toastr.error("Failed to create Special Programmes.");
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

    $(document).on("click", "#edit-specialProgrammes", function (e) {
        e.preventDefault();

        var specialProgrammesId = $(this).data("id");
        window.location.href = "/masters/special_programmes/" + specialProgrammesId + "/edit";
    });

    $(document).on("click", "#update-specialProgrammes", function (e) {
        e.preventDefault();
        var specialProgrammesId = $(this).data("update-id");
        let form = document.getElementById("specialProgrammes");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/special_programmes/" + specialProgrammesId,
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
                toastr.error("Failed to update the Special Programmes. Please try again.");
            });
    });

    $(document).on("click", "#delete-specialProgrammes", function (e) {
        e.preventDefault();
        var specialProgrammesId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this Special Programmes?")) {
            return;
        }

        $.ajax({
            url: "/masters/special_programmes/" + specialProgrammesId,
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
                toastr.error("Failed to delete the Special Programmes. Please try again.");
            },
        });
    });
});

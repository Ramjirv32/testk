$(document).ready(function () {
    $("#add-format-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("format");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/format",
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
                    toastr.error("Failed to create format.");
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

    $(document).on("click", "#edit-format", function (e) {
        e.preventDefault();

        var formatId = $(this).data("id");
        window.location.href = "/masters/format/" + formatId + "/edit";
    });

    $(document).on("click", "#update-format", function (e) {
        e.preventDefault();
        var formatId = $(this).data("update-id");
        let form = document.getElementById("format");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/format/" + formatId,
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
                toastr.error("Failed to update the format. Please try again.");
            });
    });

    $(document).on("click", "#delete-format", function (e) {
        e.preventDefault();
        var formatId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this format?")) {
            return;
        }

        $.ajax({
            url: "/masters/format/" + formatId,
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
                toastr.error("Failed to delete the format. Please try again.");
            },
        });
    });
});

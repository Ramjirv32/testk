$(document).ready(function () {
    $("#add-disciplines-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("discipline");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/disciplines",
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
                    toastr.error("Failed to create blog post.");
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

    $(document).on("click", "#edit-discipline", function (e) {
        e.preventDefault();

        var disciplineId = $(this).data("id");
        window.location.href = "/masters/disciplines/" + disciplineId + "/edit";
    });

    $(document).on("click", "#update-discipline", function (e) {
        e.preventDefault();
        var disciplineId = $(this).data("update-id");
        let form = document.getElementById("discipline");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/disciplines/" + disciplineId,
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
                toastr.error(
                    "Failed to update the discipline. Please try again."
                );
            });
    });

    $(document).on("click", "#delete-discipline", function (e) {
        e.preventDefault();
        var disciplineId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this discipline?")) {
            return;
        }

        $.ajax({
            url: "/masters/disciplines/" + disciplineId,
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
                toastr.error(
                    "Failed to delete the discipline. Please try again."
                );
            },
        });
    });
});

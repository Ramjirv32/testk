$(document).ready(function () {
    $("#add-currencies-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("currency");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/currencies",
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
                    toastr.error("Failed to create country post.");
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

    $(document).on("click", "#edit-currencies", function (e) {
        console.log("123");
        e.preventDefault();

        var currencyId = $(this).data("id");
        window.location.href = "/masters/currencies/" + currencyId + "/edit";
    });

    $(document).on("click", "#update-currency", function (e) {
        e.preventDefault();
        var currencyUpdateId = $(this).data("update-id");
        let form = document.getElementById("currency");
        let formData = new FormData(form);

        formData.append("_method", "PUT");

        $.ajax({
            url: "/masters/currencies/" + currencyUpdateId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);

                    window.location.href = response.redirect_url;
                } else {
                    toastr.error(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to update the currency. Please try again."
                );
            },
        });
    });

    $(document).on("click", "#delete-currencies", function (e) {
        e.preventDefault();
        var currencyDeleteId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this Currency?")) {
            return;
        }

        $.ajax({
            url: "/masters/currencies/" + currencyDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                if (response.success) {
                    toastr.success(response.message);
                    window.location.href = response.redirect_url;
                } else {
                    toastr.error(response.message);
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                toastr.error(
                    "Failed to delete the currency. Please try again."
                );
            },
        });
    });
});

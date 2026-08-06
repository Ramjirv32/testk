$(document).ready(function(){

    $("#add-website-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("competitive-websites");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/competitive_websites",
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
                    toastr.error("Failed to create Competitive Website.");
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

    $(document).on("click", "#edit-competitive-websites", function (e) {
        e.preventDefault();

        var websiteId = $(this).data("id");
        window.location.href = "/masters/competitive_websites/" + websiteId + "/edit";
    });

    $(document).on("click", "#update-competitive-website", function (e) {
        e.preventDefault();
        var websiteId = $(this).data("update-id");
        let form = document.getElementById("competitive-website-edit");
        let formData = new FormData(form);

        $.ajax({
            url: "/masters/competitive_websites/" + websiteId,
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: formData,websiteId,
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
                    "Failed to update the website. Please try again."
                );
            });
    });

    $(document).on("click", "#delete-competitive-websites", function (e) {
        e.preventDefault();
        var websiteId = $(this).data("delete-id");

        if (!confirm("Are you sure you want to delete this Website?")) {
            return;
        }

        $.ajax({
            url: "/masters/competitive_websites/" + websiteId,
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
                    "Failed to delete the Website. Please try again."
                );
            },
        });
    });
})

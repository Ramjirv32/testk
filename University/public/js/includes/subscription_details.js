$(document).ready(function () {
    $("#add-subscription-btn").on("click", function (e) {
        e.preventDefault();
        let form = document.getElementById("subscription");
        let formData = new FormData(form);

        $.ajax({
            url: "/subscription-details/create",
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
                    toastr.error("Failed to create subscription details.");
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                toastr.error("An error occurred. Please try again.");
            },
        });
    });

    $("#explore-id").on("click", function () {
        var subscriptionId = $(this).data("explore-id");

        $.ajax({
            url: "/get-subscription-details",
            method: "GET",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            data: {
                subscription_id: subscriptionId,
            },
            success: function (response) {
                if (response.status === "success") {
                    window.location.href = "/subscription/" + subscriptionId;
                }
            },
            error: function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch subscription details. Please try again.");
            },
        });
    });

    $(document).on("click", "#edit-subscription-detail", function (e) {
        e.preventDefault();
        var subscriptionId = $(this).data("id");
        window.location.href = "/subscription-details/" + subscriptionId + "/edit";
    });

    $(document).on("click", "#update-subscription-detail", function (e) {
        e.preventDefault();
        var subscriptionUpdateId = $(this).data("update-id");
        let form = document.getElementById("subscription");
        let formData = new FormData(form);
        formData.append("subscriptionUpdateId", subscriptionUpdateId);

        $.ajax({
            url: "/subscription-details/" + subscriptionUpdateId,
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
            alert("Failed to fetch subscription details. Please try again.");
        });
    });

    $(document).on("click", "#delete-subscription-detail", function (e) {
        e.preventDefault();
        var subscriptionDeleteId = $(this).data("delete-id");

        $.ajax({
            url: "/subscription-details/" + subscriptionDeleteId,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },

            data: {
                subscriptionDeleteId: subscriptionDeleteId,
            },
        })
            .done(function (response) {
                toastr.success(response.message);
                window.location.href = response.redirectUrl;
            })
            .fail(function (xhr, status, error) {
                console.error("Error:", error);
                alert("Failed to fetch subscription details. Please try again.");
            });
    });

});
